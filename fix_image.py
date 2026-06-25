html = open('index.html').read()

old = """    .then(data => {
      if (data.data && data.data[0] && data.data[0].url) {
        imgDiv.innerHTML = '<img src="' + data.data[0].url + '" alt="Concept visual" />';
      } else { imgDiv.innerHTML = ''; }
    })"""

new = """    .then(data => {
      if (data.data && data.data[0] && data.data[0].b64_json) {
        imgDiv.innerHTML = '<img src="data:image/png;base64,' + data.data[0].b64_json + '" alt="Concept visual" />';
      } else if (data.data && data.data[0] && data.data[0].url) {
        imgDiv.innerHTML = '<img src="' + data.data[0].url + '" alt="Concept visual" />';
      } else { imgDiv.innerHTML = ''; }
    })"""

if old in html:
    html = html.replace(old, new)
    open('index.html', 'w').write(html)
    print('Done')
else:
    print('Pattern not found - checking what is there:')
    idx = html.find('data.data[0].url')
    print(html[idx-50:idx+200])
