import pandas as pd
from datetime import datetime as dt
from pprint import pprint
import json

# capacity = 100 # MWh
# charge_rate = 50 # MW

def make_intraday_data(data, capacity, charge_rate, connection_date, region, intervals_per_hour):
    # Ensure connection_date is within the dataset
    connection_date = pd.to_datetime(connection_date).date()
    data_date_range = [min(data['Date']), max(data['Date'])]
    if data_date_range[0] > connection_date:
        raise Exception(f'Date out of range. Earliest data is {data_date_range[0]}, connection date is {connection_date}')

    # Consider only days since the battery was connected
    data = data.loc[data['Date']>=connection_date]
    
    # How many intervals can the battery run at full rate
    intervals_full_charge = int(intervals_per_hour*capacity/charge_rate)
    mwh_per_interval = charge_rate / intervals_per_hour

    # For each day, get N highest- and lowest-priced periods
    prices_per_day = data.sort_values(['Period', 'Price'], ascending=[True, False]).groupby('Date')
    dearest = prices_per_day.head(intervals_full_charge)
    cheapest = prices_per_day.tail(intervals_full_charge)
    print(dearest['Price'].mean())
    print(cheapest['Price'].mean())

    # Determine costs and revenues per day for charging and discharging
    dearest['revenue'] = round(dearest['Price']*mwh_per_interval, 2)
    cheapest['cost'] = round(cheapest['Price']*mwh_per_interval, 2)
    daily_revenue = dearest.groupby('Date')['revenue'].sum().reset_index()
    daily_revenue['revenue'] = daily_revenue['revenue']
    daily_costs = cheapest.groupby('Date')['cost'].sum().reset_index()
    daily_costs['cost'] = daily_costs['cost']
    # print(f"{daily_revenue=}")
    # print(f"{daily_costs=}")

    # Subtract costs from revenues to determine net revenue per day
    daily_balance = daily_revenue.merge(daily_costs, how='outer', on='Date')
    daily_balance['net'] = daily_balance['revenue'] - daily_balance['cost']
    daily_balance['net_cumsum'] = daily_balance['net'].cumsum()

    # print(f"{daily_balance=}")

    # Choose the 4 samples for intraday: highest/lowest revenue plus summer/winter
    best_day = daily_balance[['Date', 'net']].sort_values(by='net').iloc[0]
    worst_day = daily_balance[['Date', 'net']].sort_values(by='net').iloc[-1]
    # print(f'{best_day=}')
    # print(f'{worst_day=}')

    # Format dates as strings for parsing in JS script
    data['Period_str'] = data['Period'].astype(str)
    dearest['Period_str'] = dearest['Period'].astype(str)
    cheapest['Period_str'] = cheapest['Period'].astype(str)
    daily_balance['Date_str'] = daily_balance['Date'].astype(str)

    # Select summer and winter days, format for export
    sample_year = '2024'
    summer_day = pd.to_datetime(f'{sample_year}-12-30').date()
    summer_json = None
    winter_day = pd.to_datetime(f'{sample_year}-06-30').date()
    winter_json = None
    if summer_day in daily_balance['Date'].unique():
        summer_json = data.loc[data['Date']==summer_day][['Period_str', 'Price']]\
            .rename(columns={'Period_str': 'Datetime'}).to_dict(orient='records')

    if winter_day in daily_balance['Date'].unique():
        winter_json = data.loc[data['Date']==winter_day][['Period_str', 'Price']]\
            .rename(columns={'Period_str': 'Datetime'}).to_dict(orient='records')

    dearest_json = dearest[['Period_str', 'Price']].rename(columns={'Period_str': 'Datetime'}).to_dict(orient='records')
    cheapest_json = cheapest[['Period_str', 'Price']].rename(columns={'Period_str': 'Datetime'}).to_dict(orient='records')
    revenue_json = daily_balance[['Date_str', 'revenue', 'cost', 'net_cumsum']].rename(columns={'Date_str': 'Date'}).to_dict(orient='records')

    # print(data.columns)
    # data = data[['Period', 'Period_str', 'Date', 'Time', 'Price']]
    

    return {
        'summer': summer_json,
        'summer_date': summer_day.strftime('%Y-%m-%d'),
        'winter': winter_json,
        'winter_date': winter_day.strftime('%Y-%m-%d'),
        'dearest': dearest_json,
        'cheapest': cheapest_json,
        'revenue': revenue_json
    }




# data = data.loc[data['Date']==data['Date'].unique()[1]]


input_data = pd.read_pickle('aggregate_data.pkl')
output_data = make_intraday_data(input_data, 100, 40, '2024-04-01', 'QLD1', 12)
# pprint(output_data)
for k in output_data:
    print(f'{k}: {'*' if output_data.get(k) else ' '}')

# data_json = output_data.loc[data['Date']==data['Date'].unique()[2]][['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
# dearest_json = dearest[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
# cheapest_json = cheapest[['Datetime_str', 'Price']].rename(columns={'Datetime_str': 'Datetime'}).to_dict(orient='records')
# revenue_json = daily_balance[['Date_str', 'revenue', 'cost', 'net_cumsum']].rename(columns={'Date_str': 'Date'}).to_dict(orient='records')

# output = {
#     'alldata': data_json,
#     'dearest': dearest_json,
#     'cheapest': cheapest_json,
#     'revenue': revenue_json
# }

with open('output.json', 'w') as f:
    json.dump(output_data, f)
