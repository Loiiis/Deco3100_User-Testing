let chart1Playing = false;
let chart1Interval = null;
let chart1Index = 0;

// ================================
// Chart 1: House Price vs Income (FIXED)
// ================================

Papa.parse("house_price_income.csv", {

    download: true,
    header: true,

    complete: function(results){

        console.log("CSV loaded:", results.data);

        const clean = results.data.filter(r =>
            r.Year && r.HousePrice && r.AverageIncome
        );

        if(clean.length === 0){
            console.error("❌ CSV empty or not loaded");
            return;
        }

        const years = clean.map(r => r.Year);
        const prices = clean.map(r => Number(r.HousePrice));
        const incomes = clean.map(r => Number(r.AverageIncome));

        Plotly.newPlot(
    "priceIncomeChart",
    [   
        {
            x:[years[0]],
            y:[prices[0]],
            mode:"lines+markers",
            name:"House Price"
        },
        {
            x:[years[0]],
            y:[incomes[0]],
            mode:"lines+markers",
            name:"Income"
        }
    ],
    {

title: {
                    text: "House Price vs Income Price",
                    font: { size: 18 }
                },


        xaxis:{
            title:"Year",
            range:[2005,2025]
        },

        yaxis:{
            title:"AUD (Million)",
            range:[0,2500000]
        }
    }
);

        // store data globally for animation
        window.chart1Data = { years, prices, incomes };
    }
});


// ================================
// PLAY
// ================================

window.playChart1 = function(){

    const data = window.chart1Data;

    if(!data) return;

    if(chart1Playing) return;

    chart1Playing = true;

    if(chart1Index >= data.years.length - 1){

        chart1Index = 0;

        Plotly.restyle("priceIncomeChart",{

            x:[
                [data.years[0]],
                [data.years[0]]
            ],

            y:[
                [data.prices[0]],
                [data.incomes[0]]
            ]

        });
    }

    chart1Interval = setInterval(() => {

        if(chart1Index >= data.years.length - 1){

            clearInterval(chart1Interval);

            chart1Playing = false;

            return;
        }

        chart1Index++;

        Plotly.restyle("priceIncomeChart",{

            x:[
                data.years.slice(0, chart1Index + 1),
                data.years.slice(0, chart1Index + 1)
            ],

            y:[
                data.prices.slice(0, chart1Index + 1),
                data.incomes.slice(0, chart1Index + 1)
            ]

        });

    },1200);
};


// ================================
// PAUSE
// ================================

window.pauseChart1 = function(){
    chart1Playing = false;
    clearInterval(chart1Interval);
};

// ================================
// Chart 2:IRSAD VS Educational Attainment
// ================================

Papa.parse("irsad_education.csv", {

    download: true,
    header: true,

    complete: function(results){

        const combined = results.data
            .map(row => ({
                irsad: Number(row.IRSAD),
                bachelor: Number(row.BachelorRate),
                area: row.Area
            }))
            .filter(d => !isNaN(d.irsad) && !isNaN(d.bachelor))
            .sort((a, b) => a.irsad - b.irsad);

        const irsad = combined.map(d => d.irsad);
        const bachelor = combined.map(d => d.bachelor);
        const suburbs = combined.map(d => d.area);

        const scatter = {

            x: irsad,
            y: bachelor,
            text: suburbs,

            mode: "markers+text",
            type: "scatter",

            textposition: "top center",
            textfont: {
                size: 9,
                color: "#333"
            },

            marker: {
                size: 12,
                color: "#2563eb",
                opacity: 0.8
            },

            hovertemplate:
                "<b>%{text}</b><br>" +
                "IRSAD: %{x}<br>" +
                "Bachelor Degree: %{y}%<extra></extra>"
        };

        const layout = {

            title: "IRSAD vs Educational Attainment",

            xaxis: {
                title: "IRSAD (Low → High)",
                type: "linear"
            },

            yaxis: {
                title: "Bachelor Degree (%)"
            },

            hovermode: "closest",

            margin: {
                l: 70,
                r: 20,
                t: 70,
                b: 60
            }
        };

        Plotly.newPlot("educationChart", [scatter], layout, {
            responsive: true
        });
    }
});


// ================================
// Chart 3: IRSAD VS Home Ownership
// ================================

Papa.parse("irsad_homeownership.csv", {

    download: true,
    header: true,

    complete: function(results){

        const clean = results.data.filter(row =>
            row.Area && row.HomeOwnership
        );

        const areas = clean.map(row => row.Area);
        const ownership = clean.map(row => Number(row.HomeOwnership));

        const bar = {

            x: areas,
            y: ownership,

            type: "bar",

            marker: {
                color: "#98d4f7"
            },

            text: ownership.map(v => v + "%"),
            textposition: "outside",

            hovertemplate:
                "<b>%{x}</b><br>" +
                "Home Ownership: %{y}%<extra></extra>"
        };

        const layout = {

            title: {
                text: "IRSAD VS Home Owenership",
                font: { size: 18 }
            },

            xaxis: {
                title: "IRSAD"
            },

            yaxis: {
                title: "Home Ownership (%)",
                range: [0, 100]
            },

            margin: {
                l: 70,
                r: 20,
                t: 70,
                b: 120
            },

            plot_bgcolor: "#ffffff",
            paper_bgcolor: "#ffffff"
        };

        Plotly.newPlot(
            "ownershipChart",
            [bar],
            layout,
            { responsive: true }
        );
    }
});


// ============================
// Chart 4 - Housing Race
// ============================

let raceInterval = null;
let playing = false;

// IMPORTANT: progress time (DO NOT reset on pause)
let t = 0;

// ============================
// CONFIG
// ============================

const HOUSE_PRICE = 3500000;

const depositA = 800000; // A advantage
const depositB = 0;

const incomePerStep = 180000;
const STEP_TIME = 200;

// track width (%)
const TRACK = 85;

// ============================
// UTIL
// ============================

function progress(wealth) {
    return Math.min(wealth / HOUSE_PRICE, 1);
}

// convert progress → position
function toPos(p) {
    return p * TRACK;
}

// ============================
// INIT (runs once)
// ============================

function initRace() {

    const A = document.getElementById("runnerA");
    const B = document.getElementById("runnerB");

    if (!A || !B) return;

    // initial wealth
    const pA0 = progress(depositA);
    const pB0 = progress(depositB);

    A.style.left = toPos(pA0) + "%";
    B.style.left = toPos(pB0) + "%";

    setMoney();
}

function setMoney() {

    const wealthA = depositA + t * incomePerStep;
    const wealthB = depositB + t * incomePerStep;

    const mA = document.getElementById("moneyA");
    const mB = document.getElementById("moneyB");

    if (mA) mA.innerText = `$${Math.round(wealthA).toLocaleString()} (deposit advantage)`;
    if (mB) mB.innerText = `$${Math.round(wealthB).toLocaleString()} (no deposit)`;
}

// ============================
// PLAY (CONTINUE MODE)
// ============================

function playRace() {

    if (playing) return;
    playing = true;

    const A = document.getElementById("runnerA");
    const B = document.getElementById("runnerB");

    raceInterval = setInterval(() => {

        // time moves forward ONLY
        t += 0.4;

        const wealthA = depositA + t * incomePerStep;
        const wealthB = depositB + t * incomePerStep;

        const pA = progress(wealthA);
        const pB = progress(wealthB);

        // update positions
        A.style.left = toPos(pA) + "%";
        B.style.left = toPos(pB) + "%";

        setMoney();

        // =========================
        // WIN CHECK
        // =========================

        const A_finish = pA >= 1;
        const B_finish = pB >= 1;

        if (A_finish || B_finish) {

            clearInterval(raceInterval);
            playing = false;

            showResult(A, B, A_finish, B_finish);
        }

    }, STEP_TIME);
}

// ============================
// PAUSE
// ============================

function pauseRace() {
    clearInterval(raceInterval);
    playing = false;
}

// ============================
// WIN DISPLAY (CLEAN RESET SAFE)
// ============================

function showResult(A, B, A_finish, B_finish) {

    // remove old icons first (IMPORTANT FIX)
    document.querySelectorAll(".result-icon").forEach(el => el.remove());

    function add(el, icon) {
        const d = document.createElement("div");
        d.className = "result-icon";
        d.innerText = icon;
        d.style.position = "absolute";
        d.style.top = "-25px";
        d.style.left = "10px";
        d.style.fontSize = "20px";
        el.appendChild(d);
    }

    if (A_finish && !B_finish) {
        add(A, "🏆");
        add(B, "😓");
    }

    if (B_finish && !A_finish) {
        add(B, "🏆");
        add(A, "😓");
    }

    if (A_finish && B_finish) {
        add(A, "🏆");
        add(B, "🏆");
    }
}

// ============================
// INIT RUN
// ============================

initRace();