// @ts-nocheck
class MarketingBudgetRechner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        :host { display:block; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", Roboto, sans-serif; background:#f4f4f6; padding:20px; }
        .budget-calculator {
          max-width: 1200px; /* desktop max width */
          margin: 40px auto;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
          padding: 32px;
          color: #1c1c1e;
        }
        h2 { text-align:center; font-size:1.8rem; margin-bottom:6px; }
        .subtitle { text-align:center; color:#666; margin-bottom:24px; }
        .input-grid { display:flex; gap:24px; flex-wrap:wrap; }
        .column { flex:1; min-width:280px; }
        label { font-size:0.9rem; color:#444; display:block; margin-bottom:6px; margin-top:12px; }
        input {
          padding:10px;
          border:1px solid #d2d2d7;
          border-radius:10px;
          font-size:1rem;
          background:#f9f9f9;
          width:100%;
          box-sizing:border-box;
          transition: all 0.2s;
        }
        input:focus {
          outline:none;
          border-color:#0071e3;
          background:white;
          box-shadow:0 0 0 2px rgba(0,113,227,0.1);
        }
        .info { font-size:0.85rem; color: #0071e3; margin-top:6px; }
        .button-main {
          margin-top:30px;
          width:100%;
          background:#0071e3;
          color:white;
          font-weight:600;
          border:none;
          border-radius:14px;
          padding:14px;
          font-size:1.1rem;
          cursor:pointer;
          transition: background 0.2s;
        }
        .button-main:hover { background:#0a84ff; }
        .warning { font-size:0.95rem; margin-top:12px; margin-bottom:12px; }
        .results { margin-top:20px; text-align:center; display:none; }
        .result-grid {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
          margin-bottom:30px;
        }
        .result-card {
          background:#f5f5f7;
          padding:16px;
          border-radius:16px;
        }
        .result-card.highlight { background:#e8f0fe; box-shadow:0 0 0 2px #0071e3 inset; }
        .result-card h1 { margin:6px 0; font-size:1.8rem; }
        .chart-container {
          overflow: visible;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 40px;
        }
        .y-axis-label {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 0.75rem;
          color: #666;
          margin-right: 4px;
          flex-shrink: 0;
        }
        canvas { width:100%; height:400px; flex:1; }
        @media (max-width:1200px) {
          .budget-calculator { max-width: 900px; }
        }
        @media (max-width:900px) {
          .budget-calculator { padding:24px; }
        }
        @media (max-width:600px){
          canvas { height:450px !important; }
          .result-grid { grid-template-columns:1fr; margin-bottom:40px; }
          .y-axis-label { font-size: 0.7rem; margin-right: 2px; }
          .input-grid { flex-direction: column; }
        }
        footer { text-align:center; margin-top:20px; font-size:13px; color:#999; }
        footer a { color:#0071e3; text-decoration:none; }
        footer a:hover { text-decoration:underline; }
        .overlay{
          position:fixed; top:0; left:0; width:100%; height:100%;
          background:rgba(0,0,0,0.5); display:none; justify-content:center; align-items:center;
          z-index:999; padding:20px; box-sizing:border-box; overflow:auto;
        }
        .overlay-content{
          background:#fff; padding:24px; border-radius:16px; width:100%; max-width:600px; max-height:90vh;
          box-shadow:0 10px 30px rgba(0,0,0,0.2); overflow:auto; box-sizing:border-box;
        }
        .overlay-content textarea{
          width:100%; height:120px; font-family:monospace; border-radius:8px; border:1px solid #ccc; padding:8px; box-sizing:border-box;
        }
        .close-btn{ background:#0071e3; color:white; border:none; padding:8px 16px; border-radius:8px; margin-top:12px; cursor:pointer; }
        .close-btn:hover{ background:#0a84ff; }
      </style>

      <div class="budget-calculator">
        <h2>Marketing-Budget-Rechner</h2>
        <p class="subtitle">Berechne, welches Budget du brauchst – und wie sich dein Gewinn bei unterschiedlichem Werbeeinsatz verändert.</p>

        <div class="input-grid">
          <div class="column">
            <h3>Grunddaten</h3>
            <label>Bruttoumsatz pro Bestellung (in €)</label>
            <input id="revenueGross" type="text" placeholder="z. B. 60">
            <label>Netto-Umsatz (berechnet)</label>
            <input id="revenueNet" type="text" readonly style="background:#f0f0f0;">
            <label>Variable Kosten (Produktion + Versand, in €)</label>
            <input id="variableCost" type="text" placeholder="z. B. 30">
            <div id="netProfitInfo" class="info"></div>
          </div>

          <div class="column">
            <h3>Szenario</h3>
            <label>Fixkosten extern (z. B. Agentur, Tools, in €)</label>
            <input id="fixedCost" type="text" placeholder="z. B. 1.000">
            <label>ROAS</label>
            <input id="roas" type="text" placeholder="z. B. 3">
          </div>
        </div>

        <button class="button-main" id="calcBtn">Berechnen</button>
        <p id="warning" class="warning"></p>

        <div class="results" id="results">
          <div class="result-grid">
            <div class="result-card highlight">
              <p><strong>Profit pro Werbe-Euro</strong></p>
              <h1 id="profitPerEuro">–</h1>
            </div>
            <div class="result-card">
              <p><strong>Benötigtes Werbebudget (Break-Even)</strong></p>
              <h1 id="neededBudget">–</h1>
            </div>
          </div>

          <div class="chart-container">
            <div class="y-axis-label">Gewinn (€)</div>
            <canvas id="budgetChart"></canvas>
          </div>
        </div>

        <footer>
          <a href="#" id="embedLink"><strong>🔗 Rechner einbetten / teilen</strong></a> – entwickelt von 
          <a href="https://www.purple-noon.de" target="_blank">Purple Noon</a>
        </footer>
      </div>

      <div class="overlay" id="overlay">
        <div class="overlay-content">
          <h3>Einbettungscode:</h3>
          <textarea readonly><iframe src="https://p-noon.github.io/marketing-budget-rechner" width="100%" height="950" style="border:none;"></iframe></textarea>
          <button class="close-btn" id="closeOverlayBtn">Schließen</button>
        </div>
      </div>
    `;

    // instance state
    this._chart = null;
    this._chartLoaded = false;
    this._waitingChartInits = [];
  }

  connectedCallback() {
    this._s = this.shadowRoot;

    // helpers
    this.parseNum = v => parseFloat(String(v || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
    this.fmt = (n, dec = 2) => isFinite(n) ? n.toLocaleString('de-DE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '–';

    // elements
    const ids = ['revenueGross','revenueNet','variableCost','netProfitInfo','fixedCost','roas','calcBtn','warning','results','profitPerEuro','neededBudget','budgetChart','embedLink','overlay','closeOverlayBtn'];
    ids.forEach(id => this[id] = this._s.getElementById(id));

    // wire events
    this._s.getElementById('revenueGross').addEventListener('input', () => { this.updateNetto(); });
    this._s.getElementById('variableCost').addEventListener('input', () => { this.updateNetto(); });

    ['revenueGross','variableCost','fixedCost','roas'].forEach(id=>{
      const el = this._s.getElementById(id);
      el.addEventListener('blur', ()=> { el.value = this.fmt(this.parseNum(el.value)).replace(',00',''); });
      el.addEventListener('input', ()=> { this.updateNetto(); });
    });

    this._s.getElementById('calcBtn').addEventListener('click', ()=> this.calcBudget());
    this._s.getElementById('embedLink').addEventListener('click', (e)=> { e.preventDefault(); this._s.getElementById('overlay').style.display = 'flex'; });
    this._s.getElementById('closeOverlayBtn').addEventListener('click', ()=> { this._s.getElementById('overlay').style.display = 'none'; });

    // initial compute
    this.updateNetto();

    // ensure Chart.js loaded then ready (dynamic loader)
    this._ensureChart(() => {
      // nothing to init immediately; chart will be created upon calc
    });
  }

  // dynamic Chart.js loader (adds script to document once)
  _ensureChart(callback) {
    if (this._chartLoaded) { callback(); return; }
    if (window.Chart) { this._chartLoaded = true; callback(); return; }

    // if another instance is loading, queue callbacks
    if (document.querySelector('script[data-marketing-budget-rechner-chartjs]')) {
      // wait until it's loaded
      const check = () => {
        if (window.Chart) { this._chartLoaded = true; callback(); } else setTimeout(check, 80);
      };
      check();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.setAttribute('data-marketing-budget-rechner-chartjs', '1');
    script.onload = () => {
      this._chartLoaded = true;
      callback();
    };
    script.onerror = () => {
      console.error('Chart.js loading failed.');
      callback(); // still callback so UI doesn't hang (chart won't render)
    };
    document.head.appendChild(script);
  }

  updateNetto() {
    const gross = this.parseNum(this._s.getElementById('revenueGross').value);
    const variable = this.parseNum(this._s.getElementById('variableCost').value);
    const net = gross / 1.19;
    const ertrag = net - variable;
    this._s.getElementById('revenueNet').value = gross ? this.fmt(net) + ' €' : '';
    this._s.getElementById('netProfitInfo').innerText = gross ? `Netto-Ertrag pro Bestellung: ${this.fmt(ertrag)} €` : '';
  }

  calcBudget() {
    const gross = this.parseNum(this._s.getElementById('revenueGross').value);
    const variable = this.parseNum(this._s.getElementById('variableCost').value);
    const fixed = this.parseNum(this._s.getElementById('fixedCost').value);
    const roas = this.parseNum(this._s.getElementById('roas').value);

    const net = gross / 1.19;
    // Y = (net - variable) / gross  (profit per order relative to gross)
    const Y = gross ? (net - variable) / gross : 0;
    const minROAS = Y !== 0 ? 1 / Y : Infinity;
    const Z = roas * Y - 1; // profit per 1€ ad spend

    this._s.getElementById('profitPerEuro').innerText = (isFinite(Z) ? this.fmt(Z) : '–');
    const neededBudget = Z > 0 ? fixed / Z : 0;
    this._s.getElementById('neededBudget').innerText = Z > 0 ? this.fmt(neededBudget) + ' €' : '–';

    const warningEl = this._s.getElementById('warning');
    if (Z <= 0) {
      warningEl.style.color = "red";
      warningEl.innerText = "ROAS erlaubt kein profitables Modell.";
    } else if (neededBudget === 0) {
      warningEl.style.color = "blue";
      warningEl.innerText = "Ab dem ersten Euro wird Gewinn erzielt.";
    } else {
      warningEl.style.color = "blue";
      warningEl.innerText = "";
    }

    // prepare data for chart
    const budgets = [];
    const profits = [];
    const maxBudget = Math.max(neededBudget * 2, 5000);
    const step = Math.max(250, Math.round(maxBudget / 20 / 250) * 250 || 500); // adaptive step, roughly 20 points
    for (let i = 0; i <= maxBudget; i += step) {
      budgets.push(i);
      profits.push(i * Z - fixed);
    }

    this._s.getElementById('results').style.display = 'block';
    this._renderChart(budgets, profits);
  }

  _renderChart(budgets, profits) {
    // ensure Chart.js ready
    this._ensureChart(() => {
      const canvas = this._s.getElementById('budgetChart');
      const ctx = canvas.getContext('2d');

      // destroy previous
      if (this._chart) {
        try { this._chart.destroy(); } catch (e) { /* ignore */ }
        this._chart = null;
      }

      // plugin to draw vertical labels (replicates original)
      const verticalLabelsPlugin = {
        id: 'verticalLabelsPlugin_' + Math.random().toString(36).slice(2,8),
        afterDraw: (chart, args, opts) => {
          const { ctx, scales: { y } } = chart;
          if (!y) return;
          ctx.save();
          ctx.font = (window.innerWidth < 600 ? '9px' : '11px') + ' sans-serif';
          ctx.fillStyle = '#777';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const ticks = y.ticks;
          ticks.forEach(t => {
            const yPos = y.getPixelForValue(t.value);
            ctx.save();
            ctx.translate(y.left - 8, yPos);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(this.fmt(t.value, 0), 0, 0);
            ctx.restore();
          });
          ctx.restore();
        }
      };

      // create chart
      try {
        this._chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: budgets.map(b => this.fmt(b, 0)),
            datasets: [{
              label: 'Gewinn (€)',
              data: profits,
              borderColor: '#0071e3',
              backgroundColor: 'rgba(0,113,227,0.1)',
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            plugins: { legend: { display: false } },
            layout: { padding: { top: 25, left: 20 } },
            scales: {
              x: {
                title: { display: true, text: 'Marketingbudget (€)' },
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: window.innerWidth < 600 ? 4 : 8,
                  font: { size: window.innerWidth < 600 ? 10 : 12 }
                }
              },
              y: {
                display: false,
                ticks: { maxTicksLimit: 5 },
                suggestedMax: Math.max(...profits) * 1.1
              }
            }
          },
          plugins: [verticalLabelsPlugin]
        });

        // force resize so height is correct inside shadow DOM
        setTimeout(()=>{ try { this._chart.resize(); } catch(e){} }, 50);
      } catch (err) {
        console.error('Chart render error', err);
      }
    });
  }
}

customElements.define('marketing-budget-rechner', MarketingBudgetRechner);
