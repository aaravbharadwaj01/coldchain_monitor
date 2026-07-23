// =====================================================================
// Live Overview Chart (vanilla canvas, no external libs)
// =====================================================================
const canvas = document.getElementById('liveChart');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
  const parentWidth = canvas.parentElement.clientWidth - 44;
  canvas.width = parentWidth * 2;
  canvas.height = 200 * 2;
  canvas.style.width = parentWidth + 'px';
  canvas.style.height = '200px';
  ctx.setTransform(2,0,0,2,0,0);
  drawChart();
}

// ---------------------------------------------------------------------
// 🔌 INTEGRATION POINT: these two arrays are placeholder sample points.
// Replace with the last N readings pulled from the SQL `sensor_readings`
// table (populated by the ESP32 devices), e.g.:
//
//   const res = await fetch("/api/sensor-data/recent?minutes=60");
//   const rows = await res.json(); // [{ts, temperature, humidity, vehicle_id}, ...]
//   const tempData = rows.map(r => r.temperature);
//   const humData  = rows.map(r => r.humidity);
//
// See backend/api/server.js for the exact SQL query
// (SELECT ... FROM sensor_readings WHERE recorded_at >= NOW() - INTERVAL ...)
// ---------------------------------------------------------------------
let tempData = [];
let humData  = [];

async function loadChartData() {
    try {
        const response = await fetch(https://coldchain-monitor.onrender.com/api/sensor-data/recent);

        if (!response.ok) {
            throw new Error("Unable to fetch chart data");
        }

        const rows = await response.json();

        tempData = rows.map(r => Number(r.temperature));
        humData = rows.map(r => Number(r.humidity));

        drawChart();

    } catch (err) {
        console.error("Chart Error:", err);
    }
}

function drawChart(){
  const w = canvas.width/2;
  const h = canvas.height/2;
  ctx.clearRect(0,0,w,h);

  const padL = 36, padR = 36, padT = 10, padB = 20;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const tMin=10, tMax=40;
  const hMin=25, hMax=100;

  ctx.strokeStyle = '#eef0f4';
  ctx.fillStyle = '#9aa2b1';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'right';
  const tSteps = [40,30,20,10];
  tSteps.forEach((val)=>{
    const y = padT + plotH - ((val - tMin)/(tMax-tMin))*plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w-padR, y);
    ctx.stroke();
    ctx.fillText(val, padL-8, y+4);
  });
  ctx.textAlign = 'left';
  const hSteps = [100,75,50,25];
  hSteps.forEach((val)=>{
    const y = padT + plotH - ((val - hMin)/(hMax-hMin))*plotH;
    ctx.fillText(val, w-padR+8, y+4);
  });

  function plotLine(data,min,max,color){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    data.forEach((val,i)=>{
      const x = padL + (i/(data.length-1))*plotW;
      const y = padT + plotH - ((val-min)/(max-min))*plotH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    ctx.fillStyle = color;
    data.forEach((val,i)=>{
      const x = padL + (i/(data.length-1))*plotW;
      const y = padT + plotH - ((val-min)/(max-min))*plotH;
      ctx.beginPath();
      ctx.arc(x,y,2.5,0,Math.PI*2);
      ctx.fill();
    });
  }

  plotLine(tempData, tMin, tMax, '#2f6fed');
  plotLine(humData, hMin, hMax, '#22c55e');
}

window.addEventListener("resize", resizeCanvas);

loadChartData();

setInterval(loadChartData, 2000);

resizeCanvas();
