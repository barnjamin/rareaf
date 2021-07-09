
from pyteal import *

from validator import *
from utils import *
from config import *

tc = TemplateContract(configuration)
print(tc.get_blank_hash())