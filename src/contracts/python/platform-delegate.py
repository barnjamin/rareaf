from pyteal import *
from config import *
from utils import *

def platform_delegate():
    #Allow any grouped atomic txns that are approved by the application
    return And( Global.group_size() > Int(1), valid_app_call(Gtxn[0]))

if __name__ == "__main__":
    with open(tealpath("platform-delegate.teal"), 'w') as f:
        f.write(compileTeal(platform_delegate(), Mode.Signature, version=3))
