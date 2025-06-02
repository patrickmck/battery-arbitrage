import pandas as pd
from datetime import datetime as dt
from pprint import pprint
import json

with open('misc/PRICE_AND_DEMAND_202003_QLD1.csv', 'r') as f:
    data = pd.read_csv(f)

capacity = 100 # MWh
charge_rate = 50 # MW

data = data.rename(columns={
    'RRP': 'Price',
    'TOTALDEMAND': 'Demand'
})

data['Datetime'] = pd.to_datetime(data['SETTLEMENTDATE'])
data['Date'] = data['Datetime'].dt.date
data['Time'] = data['Datetime'].dt.time
# Datetime strings for easier parsing in the JS script
data['Datetime_str'] = data['Datetime'].astype(str)

intervals_per_hour = len(data['Time'].unique())/24
op_periods = int(intervals_per_hour*capacity/charge_rate)

data = data[['Datetime', 'Datetime_str', 'Date', 'Time', 'Demand', 'Price']]
# data = data.loc[data['Date']==data['Date'].unique()[1]]

# For each day, get N highest and lowest
dearest = data.sort_values(['Date', 'Price'], ascending=[True, False]).groupby('Date').head(op_periods)
cheapest = data.sort_values(['Date', 'Price'], ascending=[True, True]).groupby('Date').head(op_periods)
# print(dearest)
# print(cheapest)


mwh_per_interval = charge_rate / intervals_per_hour
dearest['revenue'] = round(dearest['Price']*mwh_per_interval, 2)
cheapest['cost'] = round(cheapest['Price']*mwh_per_interval, 2)
daily_revenue = dearest.groupby('Date')['revenue'].sum().reset_index()
daily_revenue['revenue'] = daily_revenue['revenue']*0.001
daily_costs = cheapest.groupby('Date')['cost'].sum().reset_index()
daily_costs['cost'] = daily_costs['cost']*0.001

daily_balance = daily_revenue.merge(daily_costs, how='outer', on='Date')
daily_balance['net'] = daily_balance['revenue'] - daily_balance['cost']
daily_balance['net_cumsum'] = daily_balance['net'].cumsum()
daily_balance['Date_str'] = daily_balance['Date'].astype(str)
# print(daily_balance)

data_json = data.loc[data['Date']==data['Date'].unique()[2]][['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
dearest_json = dearest[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
cheapest_json = cheapest[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
revenue_json = daily_balance[['Date_str', 'revenue', 'cost', 'net_cumsum']].rename(columns={'Date_str': 'Date'}).to_dict(orient='records')

output = {
    'alldata': data_json,
    'dearest': dearest_json,
    'cheapest': cheapest_json,
    'revenue': revenue_json
}
pprint(output)
with open('output.json', 'w') as f:
    json.dump(output, f)
