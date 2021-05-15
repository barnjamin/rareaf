from pyteal import *
from config import *
from utils import *

def platform_delegate():
    #Allow any grouped atomic txns that are approved by the application
    return And(
        Global.group_size() > Int(1),
        Gtxn[0].type_enum() == TxnType.ApplicationCall,
        Gtxn[0].application_id() == app_id,
    )

if __name__ == "__main__":
    with open("platform-delegate.teal", 'w') as f:
        f.write(compileTeal(platform_delegate(), Mode.Signature, version=3))
