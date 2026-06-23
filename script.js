/* =========================================================
   DATA PIPELINE ARCHITECTURE

   CSV FILES
      ↓ (PapaParse)
   JSON OBJECTS
      ↓
   DATA ARRAYS (years, prices, incomes)
      ↓
   VISUAL ENGINES (Plotly)
      ↓
   INTERACTIVE UI (buttons + animation)
========================================================= */

let chart1Playing = false;
let chart1Interval = null;
let chart1Index = 0;

// =========================================================
// CHART 1: TIME SERIES VISUALIZATION
// PURPOSE:
// Compare house price vs income over time
// =========================================================

// Step 1: Load CSV asynchronously

Papa.parse("house_price_income.csv", {

    download: true, // fetch file from server
    header: true, // convert CSV → objects

    complete: function(results){

        console.log("CSV loaded:", results.data);

// Step 2: Data cleaning (filter invalid rows)
        const clean = results.data.filter(r =>
            r.Year && r.HousePrice && r.AverageIncome
        );

        if(clean.length === 0){
            console.error("❌ CSV empty or not loaded");
            return;
        }

        // Step 3: transform data → numeric arrays
        const years = clean.map(r => r.Year);
        const prices = clean.map(r => Number(r.HousePrice));
        const incomes = clean.map(r => Number(r.AverageIncome));

        // Step 4: initialize visualization
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

// Step 5: store globally for animation system
        // store data globally for animation
        window.chart1Data = { years, prices, incomes };
    }
});

// =========================================================
// ANIMATION ENGINE (TIME-BASED LOOP)
// =========================================================

// ================================
// PLAY
// ================================

window.playChart1 = function(){

    const data = window.chart1Data;

    if(!data) return;

    if(chart1Playing) return; // prevent duplicate loops

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

/* CORE IDEA:
           Instead of redrawing full chart,
           we gradually extend arrays (progressive disclosure)
        */

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

Papa.parse("IRSAD_education.csv", {

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
                title: "IRSAD Score",
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

Papa.parse("IRSAD_homeownership.csv", {

    download: true,
    header: true,

    complete: function(results){

        const clean = results.data.filter(row =>
            row.Area &&
            row.IRSAD &&
            row.HomeOwnership
        );

        const irsad = clean.map(row => Number(row.IRSAD));
        const ownership = clean.map(row => Number(row.HomeOwnership));
        const areas = clean.map(row => row.Area);

        const scatter = {

            x: irsad,
            y: ownership,

            mode: "markers+text",
            type: "scatter",

            text: areas,
            textposition: "top center",

            textfont: {
                size: 10
            },

            marker: {
                size: 12,
                color: "#10b981",
                opacity: 0.85
            },

            hovertemplate:
                "<b>%{text}</b><br>" +
                "IRSAD: %{x}<br>" +
                "Home Ownership: %{y}%<extra></extra>"
        };

        const layout = {

            title: {
                text: "IRSAD vs Home Ownership",
                font: {
                    size: 18
                }
            },

            xaxis: {
                title: "IRSAD Score",
                type: "linear"
            },

            yaxis: {
                title: "Home Ownership (%)",
                range: [0, 80]
            },

            hovermode: "closest",

            margin: {
                l: 70,
                r: 30,
                t: 70,
                b: 60
            },

            plot_bgcolor: "#ffffff",
            paper_bgcolor: "#ffffff"
        };

        Plotly.newPlot(
            "ownershipChart",
            [scatter],
            layout,
            {
                responsive: true
            }
        );
    }
});


// ============================
// Chart 4
// ============================

// =========================================================
// INTERGENERATIONAL WEALTH SIMULATION MODEL
// =========================================================

/*
CORE ASSUMPTION:
wealth(t) = initial_deposit + income * time
*/


let raceInterval = null;
let playing = false;

let t = 0;

const START_AGE = 25;

const HOUSE_PRICE = 3500000;
// Person A has the advantage of deposit from parental gift.
const depositA = 700000;
// Person B starts with no wealth
const depositB = 0;

const incomePerStep = 180000;

const STEP_TIME = 200;


// ============================
// progress
// ============================

// convert wealth → normalized progress (0 to 1)
function progress(wealth){

    return Math.min(
        wealth / HOUSE_PRICE,
        1
    );
}


// ============================
// position
// ============================

// A: 5% -> 45%

/*
MAP:
progress 0 → 5% (start)
progress 1 → 45% (house)

This is mathematical → visual transformation
*/


function posA(p){

    return 5 + p * 40;
}


// B: 5% -> 45% (right side)

function posB(p){

    return 5 + p * 40;
}


// ============================
// init
// ============================

function initRace(){

    const A =
        document.getElementById("runnerA");

    const B =
        document.getElementById("runnerB");

    if(!A || !B) return;

    A.style.left =
        posA(progress(depositA)) + "%";

    A.style.right = "auto";

    B.style.right =
        posB(progress(depositB)) + "%";

    B.style.left = "auto";

    setMoney();
}


// ============================
// update info
// ============================

function setMoney(){

    const wealthA =
        depositA + t * incomePerStep;

    const wealthB =
        depositB + t * incomePerStep;

    document.getElementById("moneyA").innerText =
        `A Wealth: $${Math.round(wealthA).toLocaleString()}`;

    document.getElementById("moneyB").innerText =
        `B Wealth: $${Math.round(wealthB).toLocaleString()}`;

    const age =
        START_AGE + Math.floor(t);

    document.getElementById("ageA").innerText =
        `Age ${age}`;

    document.getElementById("ageB").innerText =
        `Age ${age}`;
}


// ============================
// play
// ============================

function playRace(){

    const wealthA =
        depositA + t * incomePerStep;

    const wealthB =
        depositB + t * incomePerStep;

    if(
        progress(wealthA) >= 1 ||
        progress(wealthB) >= 1
    ){
        resetRace();
    }

    if(playing) return;

    playing = true;

    const A =
        document.getElementById("runnerA");

    const B =
        document.getElementById("runnerB");

    raceInterval = setInterval(()=>{

        t += 0.4;

        const wealthA =
            depositA + t * incomePerStep;

        const wealthB =
            depositB + t * incomePerStep;

        const pA =
            progress(wealthA);

        const pB =
            progress(wealthB);

        A.style.left =
            posA(pA) + "%";

        B.style.right =
            posB(pB) + "%";

        setMoney();

        const A_finish =
            pA >= 1;

        const B_finish =
            pB >= 1;

        if(
            A_finish ||
            B_finish
        ){

            clearInterval(
                raceInterval
            );

            playing = false;

            showResult(
                A,
                B,
                A_finish,
                B_finish
            );
        }

    }, STEP_TIME);
}


// ============================
// pause
// ============================

function pauseRace(){

    clearInterval(
        raceInterval
    );

    playing = false;
}


// ============================
// reset
// ============================

function resetRace(){

    clearInterval(
        raceInterval
    );

    playing = false;

    t = 0;

    document
        .querySelectorAll(
            ".result-icon"
        )
        .forEach(
            el => el.remove()
        );

    initRace();
}


// ============================
// result
// ============================

function showResult(
    A,
    B,
    A_finish,
    B_finish
){

    document
        .querySelectorAll(
            ".result-icon"
        )
        .forEach(
            el => el.remove()
        );

    function add(el, icon){

        const d =
            document.createElement("div");

        d.className =
            "result-icon";

        d.innerText =
            icon;

        el.appendChild(d);
    }

    if(
        A_finish &&
        !B_finish
    ){

        add(A,"🏆");
        add(B,"😓");
    }

    if(
        B_finish &&
        !A_finish
    ){

        add(B,"🏆");
        add(A,"😓");
    }

    if(
        A_finish &&
        B_finish
    ){

        add(A,"🏆");
        add(B,"🏆");
    }
}


// ============================
// start
// ============================

document.addEventListener(
    "DOMContentLoaded",
    initRace
);

// ============================
// INIT RUN
// ============================

initRace();
