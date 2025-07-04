import os
import json
from datetime import datetime as dt
import pandas as pd

data_dir = 'datafiles'
file_list = os.listdir(data_dir)

data_columns = ['REGION','SETTLEMENTDATE','TOTALDEMAND','RRP','PERIODTYPE']
df_list = list()

# Read in data and check for obvious errors
for file in file_list:
    if file[-4:] != '.csv':
        continue
    df = pd.read_csv(os.path.join(data_dir,file))

    if list(df.columns) != data_columns:
        raise Exception(f'Unexpected data shape {list(df.columns)} in file {file}')
    if df['PERIODTYPE'].unique() != ['TRADE']:
        raise Exception(f'Unexpected period type {df['PERIODTYPE'].unique()} in file {file}')
    else:
        df = df.drop(columns='PERIODTYPE')
    
    df_list.append(df)
    
complete_data = pd.concat(df_list, ignore_index=True)

# Dataframe housekeeping
complete_data = complete_data.rename(columns={
    'SETTLEMENTDATE': 'Period',
    'REGION': 'Region',
    'RRP': 'Price',
    'TOTALDEMAND': 'Demand'
})
complete_data['Period'] = pd.to_datetime(complete_data['Period'])
complete_data['Date'] = complete_data['Period'].dt.date
complete_data['Time'] = complete_data['Period'].dt.time

region_list = complete_data['Region'].unique()

# Compare actual (Date, Region) pairs to expected range of such pairs
date_region_index = pd.MultiIndex.from_product([complete_data['Date'], region_list])
date_range = pd.date_range(
    start=complete_data['Date'].sort_values().iloc[0],
    end=complete_data['Date'].sort_values().iloc[-1],
    freq='D'
)
date_region_range = pd.MultiIndex.from_product([date_range.date, region_list])
missing_dates = date_region_range.symmetric_difference(date_region_index)
if not missing_dates.empty:
    raise Exception(f'Missing dates in data files\n{missing_dates}')

output_filename = 'aggregate_data.pkl'
complete_data.to_pickle(output_filename)
print(f'Saved {round(os.path.getsize(output_filename)/1e6, 2)}MB to {output_filename}')