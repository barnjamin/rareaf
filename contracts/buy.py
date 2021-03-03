from pyteal import * 

def buy():
    Approve = Seq([Return(Int(1))])
    Deny    = Seq([Return(Int(0))])

    return Approve

if __name__ == "__main__":
    print(compileTeal(buy(), mode.Signature))
