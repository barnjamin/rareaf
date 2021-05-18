from pyteal import *
import json

def get_config():
    with open('../lib/config.json', 'r') as f:
        return json.load(f)


configuration = get_config()

listing_key   = Bytes("listing")

tag_key       = Bytes("tag:") 

app_id        = Int(int(configuration['application']['id']))
seed_amt      = Int(int(configuration['seed']))
price_token   = Int(int(configuration['token']['id']))
platform_fee  = Int(int(configuration['fee']))
max_price     = Int(int(configuration['max_price']))

platform_addr = Addr(configuration['address']) 

action_create   = Bytes("create")
action_tag      = Bytes("tag")  
action_untag    = Bytes("untag")  
action_iprice   = Bytes("price_increase")
action_dprice   = Bytes("price_decrease")
action_delete   = Bytes("delete")
action_purchase = Bytes("purchase")
