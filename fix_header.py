html = open('index.html').read()

# Update header CSS - white background, minimal
old_css = """  header {
    background: var(--black);
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }

  .logo {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 700;
    font-size: 26px;
    color: var(--yellow);
    letter-spacing: -0.02em;
    position: relative;
    display: inline-block;
  }

  .logo span {
    position: relative;
    z-index: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .header-tag {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #555;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .header-tag strong {
    color: #aaa;
  }"""

new_css = """  header {
    background: var(--white);
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1.5px solid var(--ink);
  }

  .logo {
    font-family: 'Fraunces', serif;
    font-style: italic;
    font-weight: 700;
    font-size: 26px;
    color: var(--ink);
    letter-spacing: -0.02em;
    position: relative;
    display: inline-block;
  }

  .logo span {
    position: relative;
    z-index: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 28px;
  }

  .header-tag {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--ink-light);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .header-tag strong {
    color: var(--ink-mid);
  }"""

html = html.replace(old_css, new_css)

# Also update footer to match
html = html.replace(
    """  footer {
    background: var(--black);
    padding: 20px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 80px;
    border-top: 3px solid var(--yellow);
  }

  footer p {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #444;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }""",
    """  footer {
    background: var(--white);
    padding: 20px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 80px;
    border-top: 1.5px solid var(--ink);
  }

  footer p {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--ink-light);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }"""
)

open('index.html', 'w').write(html)
print('Done')
