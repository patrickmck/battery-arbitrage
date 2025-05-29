const margin = { top: 20, right: 30, bottom: 30, left: 50 },
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// Append SVG to div
const svg = d3.select("#my_dataviz")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Load JSON data
fetch('./output.json')
    .then(response => response.json())
    .then(jsondata => {
        console.log(jsondata)
        const data = jsondata.alldata;
        const dearest = jsondata.dearest;
        const cheapest = jsondata.cheapest;

        // Parse date and convert price
        const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        [data, dearest, cheapest].forEach(arr => {
            arr.forEach(d => {
                d.Datetime = parseTime(d.Datetime);
                d.Price = +d.Price;
            });
        });

        // Set scales
        const x = d3.scaleTime()
                    .domain(d3.extent(data, d => d.Datetime))
                    .range([0, width]);

        const y = d3.scaleLinear()
                    .domain([d3.min(data, d => d.Price), d3.max(data, d => d.Price)])
                    .nice()
                    .range([height, 0]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(0))
            .attr("y2", y(0))
            .attr("stroke", "#888")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 2");

        // Line generator
        const line = d3.line()
                        .x(d => x(d.Datetime))
                        .y(d => y(d.Price));

        // Draw line
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);

        const bar_width = 2.5
        function drawBars(data, color) {
            svg.selectAll(`rect.${color}`)
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

    });

/**
fetch('./output.json')
    .then(response => response.json())
    .then(data => {
        console.log(data)
        let alldata = data.alldata;
        let dearest = data.dearest;
        let cheapest = data.cheapest;
        draw_line(alldata.Datetime, alldata.Price)
    })

document.getElementById('data-form').addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(this);
      const payload = Object.fromEntries(formData.entries());

      // Convert relevant fields to numbers
      ['size', 'capacity', 'cost', 'interest', 'degradation', 'minCharge', 'maxCharge'].forEach(key => {
        if (payload[key]) payload[key] = parseFloat(payload[key]);
      });

      // 🔄 Replace with actual API call
      // const response = await fetch('https://your-api-endpoint', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      // const data = await response.json();

      // 👇 For demo: Fake some response data
      const data = {
        values: [payload.size, payload.capacity, payload.cost]
      };

    //   renderVisualization(data);

    

    // d3.csv("PRICE_AND_DEMAND_202505_QLD1.csv",

    // // When reading the csv, I must format variables:
    // function(d){
    //     console.log(d)
    //     return { date : d3.timeParse("%Y-%m-%d")(d.SETTLEMENTDATE), price : d.RRP, demand: d.TOTALDEMAND }
    // },



    // function renderVisualization(data) {
    //   const container = d3.select('#vis-container');
    //   container.selectAll('*').remove(); // Clear old visuals

    //   const svg = container.append('svg')
    //     .attr('width', 600)
    //     .attr('height', 400);

    //   const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    //   const width = +svg.attr('width') - margin.left - margin.right;
    //   const height = +svg.attr('height') - margin.top - margin.bottom;

    //   const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    //   const values = data.values || [];
    //   const x = d3.scaleBand().domain(values.map((_, i) => i)).range([0, width]).padding(0.1);
    //   const y = d3.scaleLinear().domain([0, d3.max(values)]).range([height, 0]);

    //   g.selectAll('rect')
    //     .data(values)
    //     .enter()
    //     .append('rect')
    //     .attr('x', (_, i) => x(i))
    //     .attr('y', d => y(d))
    //     .attr('width', x.bandwidth())
    //     .attr('height', d => height - y(d))
    //     .attr('fill', 'steelblue');

    //   g.append('g').attr('transform', `translate(0,${height})`).call(d3.axisBottom(x));
    //   g.append('g').call(d3.axisLeft(y));
    // }
});*/