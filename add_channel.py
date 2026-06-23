html = open('index.html').read()

# Add channel select after the tone select
old = """        <div class="form-group">
          <label>Tone</label>
          <select id="tone">
            <option value="">Any direction</option>
            <option>Bold & provocative</option>
            <option>Warm & human</option>
            <option>Witty & playful</option>
            <option>Cinematic & epic</option>
            <option>Raw & honest</option>
            <option>Surreal & unexpected</option>
            <option>Minimalist & pure</option>
          </select>
        </div>"""

new = """        <div class="form-group">
          <label>Tone</label>
          <select id="tone">
            <option value="">Any direction</option>
            <option>Bold & provocative</option>
            <option>Warm & human</option>
            <option>Witty & playful</option>
            <option>Cinematic & epic</option>
            <option>Raw & honest</option>
            <option>Surreal & unexpected</option>
            <option>Minimalist & pure</option>
          </select>
        </div>
        <div class="form-group">
          <label>Channel / Media</label>
          <select id="channel">
            <option value="">Any / Integrated</option>
            <option>TVC / Film</option>
            <option>Out of Home</option>
            <option>Social Media</option>
            <option>Digital / Interactive</option>
            <option>Print</option>
            <option>Experiential / Activation</option>
            <option>PR Stunt</option>
            <option>Radio / Audio</option>
          </select>
        </div>"""

html = html.replace(old, new)

# Add channel to the generateConcepts function - grab the value
old2 = "  const tone = document.getElementById('tone').value;"
new2 = """  const tone = document.getElementById('tone').value;
  const channel = document.getElementById('channel').value;"""
html = html.replace(old2, new2)

# Add channel to the user prompt
old3 = "Campaign Ambition: ${ambition||'Not specified'}\n  Tone: ${tone||'Not specified'}"
new3 = "Campaign Ambition: ${ambition||'Not specified'}\n  Tone: ${tone||'Not specified'}\n  Channel / Media: ${channel||'Any / Integrated'}"
html = html.replace(old3, new3)

# Update system prompt to consider channel
old4 = "You understand what makes juries weep: genuine human truth, unexpected creative territory, cultural relevance, craft, and ideas that couldn't belong to any other brand."
new4 = "You understand what makes juries weep: genuine human truth, unexpected creative territory, cultural relevance, craft, and ideas that couldn't belong to any other brand. When a specific channel is specified, tailor the concepts and executions specifically for that medium — a social media idea should feel native to social, an OOH idea should work at scale in the street, a PR stunt should be newsworthy."
html = html.replace(old4, new4)

open('index.html', 'w').write(html)
print('Done')
