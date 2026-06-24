html = open('index.html').read()

# Replace ING button with Hungry Jacks
html = html.replace(
    "onclick=\"loadExample('ing')\">ING</button>",
    "onclick=\"loadExample('hj')\">Hungry Jack's</button>"
)

# Replace ING example with Hungry Jacks
old = "  ing: { brand:'ING', category:'Finance / Banking', audience:'Australians 25-50 who are sick of big bank fees but have never actively looked for an alternative', ambition:'Drive brand fame', brief:'ING has been Australia\\'s best kept banking secret for 25 years. Consistently highest rated by customers. Zero fees. Great rates. And yet most Australians have never considered them. We don\\'t have a product problem. We have an attention problem. How do you make the best bank in Australia impossible to ignore?', tone:'Witty & playful' },"

new = "  hj: { brand:\"Hungry Jack's\", category:'FMCG / Food & Drink', audience:'Australians 16-35 who eat fast food regularly but default to McDonalds out of habit', ambition:'Challenge a cultural norm', brief:\"Everyone knows the burgers are better at Hungry Jack's. The product is genuinely superior. The price is competitive. And yet McDonald's dominates. Australians choose the golden arches on autopilot. How do you break a habit that has nothing to do with quality and everything to do with familiarity?\", tone:'Bold & provocative' },"

html = html.replace(old, new)
open('index.html', 'w').write(html)
print('Done')
