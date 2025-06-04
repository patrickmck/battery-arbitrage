const margin = { top: 20, right: 30, bottom: 30, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Populate the summary info, intraday and revenue charts with placeholder text
const placeholder_html = '<i>Enter data and press submit to see results.</i>'
let summary_placeholder = d3.selectAll("#info-summary")
    .append("div")
    .html(`<b>Summary Information</b><hr>${placeholder_html}`);

let chart_placeholder = d3.selectAll(".chart-container")
    .append("div")
    .html(placeholder_html);

function make_intraday_viz(fig_name, data, dearest, cheapest) {
    let intraday = d3.select(`#${fig_name}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set scales
    let x = d3.scaleTime()
                .domain(d3.extent(data, d => d.Datetime))
                .range([0, width]);

    let y = d3.scaleLinear()
                .domain([Math.min(0,d3.min(data, d => d.Price)), d3.max(data, d => d.Price)])
                .nice()
                .range([height, 0]);

    // Add axes
    intraday.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    intraday.append("g")
        .call(d3.axisLeft(y));

    intraday.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .attr("stroke", "#888")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2");

    // Line generator
    let line = d3.line()
                    .x(d => x(d.Datetime))
                    .y(d => y(d.Price));

    // Draw line
    intraday.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    let bar_width = width / data.length
    function drawBars(data, color) {
        intraday.selectAll(`rect.${color}`)
            .data(data)
            .enter()
            .append("rect")
            .attr("class", color)
            .attr("x", d => x(d.Datetime) - 0.5*bar_width)
            .attr("y", d => d.Price >= 0 ? y(d.Price) : y(0))
            .attr("width", bar_width)
            .attr("height", d => Math.abs(y(0) - y(d.Price)))
            .attr("fill", color)
            .attr("opacity", 0.3);
    }

    drawBars(dearest, "red");
    drawBars(cheapest, "green");
}

function make_revenue_summary(data) {
    let revenue_chart = d3.select("#revenue_viz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set scales
    let x = d3.scaleTime()
                .domain(d3.extent(data, d => d.Date))
                .range([0, width]);

    let y = d3.scaleLinear()
                .domain([d3.min(data, d => d.cost), d3.max(data, d => d.net_cumsum)])
                .nice()
                .range([height, 0]);

    let y2 = d3.scaleLinear()
                .domain([d3.min(data, d => d.cost), d3.max(data, d => d.revenue)])
                .nice()
                .range([height, 0]);

    let y0diff = y2(0)-y(0)

    let line = d3.line()
                    .x(d => x(d.Date))
                    .y(d => y(d.net_cumsum));

    // Add axes
    revenue_chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    revenue_chart.append("g")
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s")));

    // Draw line
    revenue_chart.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Draw green revenue bars
    let bar_width = width / data.length
    revenue_chart.selectAll(".rev-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "rev-bar")
        .attr("x", d => x(d.Date))
        .attr("y", d => y2(d.revenue)-y0diff)
        .attr("width", bar_width)
        .attr("height", d => y2(0) - y2(d.revenue))
        .attr("fill", "green")
        .attr("opacity", 0.3);

    // Draw red cost bars
    revenue_chart.selectAll(".cost-bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "cost-bar")
        .attr("x", d => x(d.Date))
        .attr("y", y(0)) // top of the cost bar starts at 0
        .attr("width", bar_width)
        .attr("height", d => y2(d.cost) - y2(0))
        .attr("fill", "red")
        .attr("opacity", 0.3);
}

// After receiving data from the API, populate the info summary
// and populate the charts in the intraday and revenue tabs
let make_charts = function(jsondata) {
    // console.log(jsondata)
    // Intraday data
    const intraday_summer = jsondata.summer;
    let intraday_summer_date = jsondata.summer_date;
    const intraday_winter = jsondata.winter;
    let intraday_winter_date = jsondata.winter_date;
    // Revenue data
    const dearest = jsondata.dearest;
    const cheapest = jsondata.cheapest;
    const revenue_data = jsondata.revenue;
    // Summary info
    const summary_html = jsondata.summary_html;

    // Remove placeholder text from the summary card and charts
    summary_placeholder.remove()
    chart_placeholder.remove()
    // Remove any existing summary info or charts
    d3.select("#info-summary").selectAll("div").remove();
    d3.selectAll(".chart-container").selectAll("svg").remove();

    // Add the new summary info
    let summary_card = d3.select("#info-summary")
        .append("div")
        .html(summary_html);

    // Parse date and convert price
    const parseDate = d3.timeParse("%Y-%m-%d");
    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
    [intraday_summer, intraday_winter, dearest, cheapest].forEach(arr => {
        arr.forEach(d => {
            d.Datetime = parseTime(d.Datetime);
            d.Price = +d.Price;
        });
    });
    intraday_summer_date = parseDate(intraday_summer_date)
    intraday_winter_date = parseDate(intraday_winter_date)

    const is_same_day = function(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    // Filter dearest and cheapest for given summer and winter dates
    const dearest_summer = dearest.filter(d => is_same_day(d.Datetime, intraday_summer_date));
    const dearest_winter = dearest.filter(d => is_same_day(d.Datetime, intraday_winter_date));
    const cheapest_summer = cheapest.filter(d => is_same_day(d.Datetime, intraday_summer_date));
    const cheapest_winter = cheapest.filter(d => is_same_day(d.Datetime, intraday_winter_date));

    // Add the new intraday charts
    make_intraday_viz('intraday_summer', intraday_summer, dearest_summer, cheapest_summer);
    make_intraday_viz('intraday_winter', intraday_winter, dearest_winter, cheapest_winter);

    revenue_data.forEach(d => {
        d.Date = parseDate(d.Date);
        d.revenue = +d.revenue;
        d.cost = +d.cost;
        d.net = +d.net;
        d.net_cumsum = +d.net_cumsum;
    })

    // Add the new revenue chart
    make_revenue_summary(revenue_data)

    return 'OK'

};

const api_url = 'foobar'
document.getElementById('data-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    let form = e.target;
    let formData = new FormData(form);
    let data = Object.fromEntries(formData.entries());
    console.log(data)

    // Send to your API (example with fetch)
    try {
        // let response = await fetch(api_url, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(data)
        // });

        let response = await fetch('./output.json')
            .then(data => data.json())
            .then(jsondata => make_charts(jsondata))

        console.log('Server response:', response);


    } catch (error) {
        console.error('Error submitting form:', error);
    }
});