html = open('index.html').read()

# Find the examples section
idx = html.find('example-pill')
print("BUTTONS:")
print(html[idx-50:idx+500])

print("\n\nEXAMPLES OBJECT:")
idx2 = html.find('const EXAMPLES')
print(html[idx2:idx2+800])
