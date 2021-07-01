from pyteal import *
import json

def get_config():
    with open('../../../config.json', 'r') as f:
        return json.load(f)


configuration = get_config()

listing_key   = Bytes("listing")

tag_key       = Bytes("tag:") 


#app_id        = Int(int(configuration['application']['id']))
#price_token   = Int(int(configuration['token']['id']))
#platform_addr = Addr(configuration['address']) 
#platform_fee  = Int(int(configuration['fee']))

app_id        = Tmpl.Int("TMPL_APP_ID")
price_token   = Tmpl.Int("TMPL_PRICE_ID")
platform_addr = Tmpl.Bytes("TMPL_OWNER_ADDR")
platform_fee  = Tmpl.Int("TMPL_FEE_AMT")

seed_amt      = Int(int(configuration['application']['seed']))
max_price     = Int(int(configuration['application']['max_price']))

action_create   = Bytes("create")
action_tag      = Bytes("tag")  
action_untag    = Bytes("untag")  
action_iprice   = Bytes("price_increase")
action_dprice   = Bytes("price_decrease")
action_delete   = Bytes("delete")
action_purchase = Bytes("purchase")
