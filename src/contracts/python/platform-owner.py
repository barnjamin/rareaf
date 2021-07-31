from pyteal import ScratchVar, Or, TealType, Mode, compileTeal
from config import *
from utils import *

def platform_owner():
    #Allow any grouped atomic txns that are approved by the application or the admin
    _app_id        = ScratchVar(TealType.uint64)

    return And( 
                Global.group_size() > Int(1), 
                Seq([
                    _app_id.store(app_id),
                    Int(1)
                ]),
                Or(
                    valid_app_call(Gtxn[0], _app_id.load()),
                    valid_admin_fee_pay(Gtxn[0])
                )
            )

if __name__ == "__main__":
    with open(tealpath("platform-owner.teal"), 'w') as f:
        f.write(compileTeal(platform_owner(), Mode.Signature, version=4))
