html = open('index.html').read()

# Find and replace the entire EXAMPLES object
start = html.find('const EXAMPLES = {')
end = html.find('};', start) + 2

old_examples = html[start:end]

new_examples = """const EXAMPLES = {
  northern: { brand:'Great Northern Brewing Co.', category:'FMCG / Food & Drink', audience:'Australian blokes 25-45 who drink outdoors and distrust anything that tries too hard', ambition:'Drive brand fame', brief:"Great Northern has grown fast on the back of an outdoor lifestyle platform. But as it gets bigger it risks feeling like a marketing idea rather than a real brand. We need to deepen authenticity without losing the simplicity that made it work.", tone:'Raw & honest' },
  bunnings: { brand:'Bunnings Warehouse', category:'Fashion / Retail', audience:'Australians who do their own home improvements — tradies, DIYers, weekend warriors', ambition:'Drive brand fame', brief:"Bunnings is Australia's most visited retail destination but it's seen as purely functional — you go because you have to, not because you want to. We need to turn Bunnings from a place people visit into a place people genuinely love.", tone:'Warm & human' },
  qantas: { brand:'Qantas', category:'Travel & Tourism', audience:'Australians who fly regularly but have lost faith in the airline after years of poor service', ambition:'Reposition a brand', brief:"Qantas used to be a source of national pride. Now it's a punchline. Australians feel betrayed — by cancelled flights, lost baggage, and a CEO who became a villain. We need to begin rebuilding trust without pretending nothing happened.", tone:'Raw & honest' },
  commbank: { brand:'CommBank', category:'Finance / Banking', audience:'Australians 18-35 who manage finances on their phone but feel anxious about money', ambition:'Make people feel something', brief:"Money stress is Australia's silent epidemic. CommBank has the most advanced banking app in the country but people still feel like their bank is working against them. We need to position CommBank as genuinely on your side.", tone:'Warm & human' },
  bonds: { brand:'Bonds', category:'Fashion / Retail', audience:'Australians 18-35 who grew up wearing Bonds but have drifted to international brands', ambition:'Reposition a brand', brief:"Bonds is one of Australia's most loved clothing brands but it's in danger of becoming invisible — seen as basic, functional, unglamorous. We need to reclaim Bonds as a brand Australians are proud of, not just buy out of habit.", tone:'Bold & provocative' }
};"""

html = html.replace(old_examples, new_examples)

# Fix button labels and keys
html = html.replace("onclick=\"loadExample('oat')\">Oat milk", "onclick=\"loadExample('northern')\">Great Northern")
html = html.replace("onclick=\"loadExample('bank')\">Challenger bank", "onclick=\"loadExample('bunnings')\">Bunnings")
html = html.replace("onclick=\"loadExample('airline')\">Airline", "onclick=\"loadExample('qantas')\">Qantas")
html = html.replace("onclick=\"loadExample('beer')\">Craft beer", "onclick=\"loadExample('commbank')\">CommBank")
html = html.replace("onclick=\"loadExample('car')\">Electric car", "onclick=\"loadExample('bonds')\">Bonds")

# Also fix any already-renamed buttons
html = html.replace("onclick=\"loadExample('northern')\">Great Northern Brewing Co", "onclick=\"loadExample('northern')\">Great Northern")

open('index.html', 'w').write(html)
print('Done')
