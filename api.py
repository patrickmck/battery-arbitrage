import pandas as pd
from datetime import datetime as dt
from pprint import pprint
import json

with open('PRICE_AND_DEMAND_202505_QLD1.csv', 'r') as f:
    data = pd.read_csv(f)

capacity = 200 # MWh
charge_rate = 75 # MW
intervals_per_hour = 12
op_periods = int(intervals_per_hour*capacity/charge_rate)

data = data.rename(columns={
    'RRP': 'Price',
    'TOTALDEMAND': 'Demand'
})

data['Datetime'] = pd.to_datetime(data['SETTLEMENTDATE'])
data['Date'] = data['Datetime'].dt.date
data['Time'] = data['Datetime'].dt.time
# Datetime strings for easier parsing in the JS script
data['Datetime_str'] = data['Datetime'].astype(str)

data = data[['Datetime', 'Datetime_str', 'Date', 'Time', 'Demand', 'Price']]
data = data.loc[data['Date']==data['Date'].unique()[10]]

# For each day, get N highest and lowest
dearest = data.sort_values(['Date', 'Price'], ascending=[True, False]).groupby('Date').head(op_periods)
cheapest = data.sort_values(['Date', 'Price'], ascending=[True, True]).groupby('Date').head(op_periods)
# print(dearest)
# print(cheapest)

data_json = data[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
dearest_json = dearest[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
cheapest_json = cheapest[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')

output = {
    'alldata': data_json,
    'dearest': dearest_json,
    'cheapest': cheapest_json
}
pprint(output)
with open('output.json', 'w') as f:
    json.dump(output, f)
