from pyteal import Bytes, Tmpl, Int, App, Seq, If, Btoi
import json
import os

def get_config():
    config = None
    with open('../../../config.json', 'r') as f:
        config = json.load(f)

    for k,v in os.environ.items():
        if k[:5] == "TMPL_":
            config['application'][k[5:].lower()] = v

    return config




configuration = get_config()

listing_key   = Bytes("listing")
tag_key       = Bytes("tag:") 


def get_var(name):
    return App.globalGet(Bytes(name))

owner_addr    = get_var("owner_addr")
listing_hash  = get_var("listing_hash")
platform_name = get_var("name")

price_token   = Btoi(get_var("price_id"))
platform_fee  = Btoi(get_var("fee"))
seed_amt      = Btoi(get_var("seed_amt"))
max_price     = Btoi(get_var("max_price"))


tmpl_seed_amt      = Tmpl.Int("TMPL_SEED_AMT")
tmpl_fee_amt       = Tmpl.Int("TMPL_FEE_AMT")
tmpl_price_token   = Tmpl.Int("TMPL_PRICE_ID")
tmpl_app_id        = Tmpl.Int("TMPL_APP_ID")
tmpl_owner_addr    = Tmpl.Bytes("TMPL_OWNER_ADDR")
tmpl_admin_addr    = Tmpl.Bytes("TMPL_ADMIN_ADDR")

action_create  = Bytes("create")
action_tag     = Bytes("tag")  
action_untag   = Bytes("untag")  
action_iprice  = Bytes("price_increase")
action_dprice  = Bytes("price_decrease")
action_delete  = Bytes("delete")
action_purchase= Bytes("purchase")
action_safety  = Bytes("safety")
action_config  = Bytes("config")