# battery-arbitrage

1. Get complete price data (Region, SettlementDate, Price, ?Demand)
2. Given API call with (ConnectionDate, Region, Capacity, TotalCost):
    1. Compute N = number of periods per day at full (dis)charge
    2. For each day since ConnectionDate, find N top and bottom priced periods
    3. Compute difference between top and bottom for revenue per day
    4. Select top revenue, bottom revenue, summer and winter days (4 Intradays)
    5. Compute cumulative revenue per day and compare to TotalCost for payback day
    6. Return 4 Intradays, cumulative revenue, payback day and some averages
3. Populate About tab with stats/averages
4. Populate Intraday tab with 4 intraday graphs, Revenue tab with cumulative revenue graph

TODO:
* Account for cost of debt
* Account for min/max charge and battery degradation
* Use day-ahead projections rather than perfect foresight
* Account for bid stack rather than clearing price