html = open('index.html').read()

# 1. Add CSS for mode toggle
html = html.replace("  /* HEADER */", """  /* MODE TOGGLE */
  .mode-toggle {
    display: flex;
    margin-bottom: 28px;
    border: 1.5px solid var(--ink);
    width: fit-content;
  }
  .mode-btn {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 700;
    font-size: 16px;
    padding: 10px 28px;
    border: none;
    cursor: pointer;
    background: var(--white);
    color: var(--ink-light);
  }
  .mode-btn.active { background: var(--ink); color: var(--yellow); }
  .mode-btn:first-child { border-right: 1.5px solid var(--ink); }
  .mode-desc {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--ink-light);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  /* HEADER */""", 1)

# 2. Add toggle HTML before examples row
html = html.replace(
    '      <div class="examples-row">',
    """      <div class="mode-toggle">
        <button class="mode-btn active" id="btnCampaign" onclick="setMode('campaign')">Campaign</button>
        <button class="mode-btn" id="btnContent" onclick="setMode('content')">Content</button>
      </div>
      <p class="mode-desc" id="modeDesc">Big campaign ideas informed by award-winning creative thinking</p>
      <div class="examples-row">""", 1)

# 3. Add id tags to dynamic elements
html = html.replace('<label>Campaign Ambition</label>', '<label id="ambitionLabel">Campaign Ambition</label>', 1)
html = html.replace('<label>The creative challenge</label>', '<label id="briefLabel">The creative challenge</label>', 1)
html = html.replace('<label>Number of concepts</label>', '<label id="numLabel">Number of concepts</label>', 1)
html = html.replace('<option value="3">3 concepts</option>', '<option value="3" id="opt3">3 concepts</option>', 1)
html = html.replace('<option value="5">5 concepts</option>', '<option value="5" id="opt5">5 concepts</option>', 1)
html = html.replace('id="ambition">', 'id="ambition" style="width:100%">', 1)

# 4. Add mode JS and update system prompt — inject before closing script
mode_js = """
window._currentMode = 'campaign';

function setMode(mode) {
  const isCampaign = mode === 'campaign';
  window._currentMode = mode;
  document.getElementById('btnCampaign').classList.toggle('active', isCampaign);
  document.getElementById('btnContent').classList.toggle('active', !isCampaign);
  document.getElementById('modeDesc').textContent = isCampaign
    ? 'Big campaign ideas informed by award-winning creative thinking'
    : 'Practical content ideas for social media and digital channels';
  document.getElementById('ambitionLabel').textContent = isCampaign ? 'Campaign Ambition' : 'Content Goal';
  document.getElementById('briefLabel').textContent = isCampaign ? 'The creative challenge' : 'What do you want to post about?';
  document.getElementById('numLabel').textContent = isCampaign ? 'Number of concepts' : 'Number of ideas';
  document.getElementById('opt3').textContent = isCampaign ? '3 concepts' : '3 ideas';
  document.getElementById('opt5').textContent = isCampaign ? '5 concepts' : '5 ideas';
  document.getElementById('brief').placeholder = isCampaign
    ? "e.g. People know oat milk is better for the planet but they feel like they're giving something up..."
    : "e.g. We're a Melbourne cafe that does natural wine. We want to attract a younger crowd...";
  const ambition = document.getElementById('ambition');
  ambition.innerHTML = isCampaign
    ? `<option value="">Select ambition</option>
       <option>Change behaviour</option>
       <option>Challenge a cultural norm</option>
       <option>Launch a new product</option>
       <option>Reposition a brand</option>
       <option>Drive brand fame</option>
       <option>Respond to a cultural moment</option>
       <option>Make people feel something</option>`
    : `<option value="">Select goal</option>
       <option>Grow followers</option>
       <option>Drive engagement</option>
       <option>Promote a product or offer</option>
       <option>Build brand personality</option>
       <option>Educate my audience</option>
       <option>Drive traffic to website</option>
       <option>Build community</option>`;
}

function getSystemPrompt(mode) {
  if (mode === 'content') {
    return "You are a brilliant social media creative who understands how to make content that genuinely connects with people. Generate practical, specific, thumb-stopping content ideas.\\n\\nRespond ONLY with valid JSON, no markdown:\\n{\\\"concepts\\\":[{\\\"name\\\":\\\"IDEA NAME\\\",\\\"logline\\\":\\\"one sentence\\\",\\\"concept\\\":\\\"2-3 sentences on what this content is and why people engage\\\",\\\"keyInsight\\\":\\\"human truth behind the idea\\\",\\\"executionIdea\\\":\\\"specific details: caption tone, visual, format (reel/carousel/story)\\\",\\\"lionsPotential\\\":\\\"best platform and format for this\\\",\\\"inspiredBy\\\":[]}]}";
  }
  return "You are a senior creative director and strategist with encyclopedic knowledge of every Cannes Lions Grand Prix and Gold winning campaign from 1954 to 2025 — covering all categories. Generate original advertising concepts informed by the patterns and creative bravery of Lions-winning work. When a specific channel is specified, tailor concepts for that medium.\\n\\nRespond ONLY with valid JSON, no markdown:\\n{\\\"concepts\\\":[{\\\"name\\\":\\\"CAMPAIGN NAME\\\",\\\"logline\\\":\\\"poetic one sentence\\\",\\\"concept\\\":\\\"3-4 sentences on the idea\\\",\\\"keyInsight\\\":\\\"human truth\\\",\\\"executionIdea\\\":\\\"specific vivid execution detail\\\",\\\"lionsPotential\\\":\\\"which Lions category and why\\\",\\\"inspiredBy\\\":[{\\\"campaign\\\":\\\"\\\",\\\"brand\\\":\\\"\\\",\\\"year\\\":\\\"\\\",\\\"why\\\":\\\"\\\"}]}]}";
}
"""

# 5. Replace the hardcoded system prompt with dynamic one
old_sys = "  const archiveContext = '';\n\n  const systemPrompt = `You are a senior creative director"
new_sys = "  const archiveContext = '';\n\n  const systemPrompt = getSystemPrompt(window._currentMode || 'campaign');\n  const systemPromptUnused = `You are a senior creative director"
html = html.replace(old_sys, new_sys, 1)

# Close the old system prompt template string properly
# Find where it ends and fix it
# The old system prompt ends with the inspiredBy instruction
old_end = "Do not invent campaigns.\`;"
new_end = "Do not invent campaigns.\`; // unused when mode=content"
html = html.replace(old_end, new_end, 1)

# Inject mode JS before closing script tag
html = html.replace('</script>\n</body>', mode_js + '\n</script>\n</body>', 1)

open('index.html', 'w').write(html)
print('Done')
