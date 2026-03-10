from important_info import DSN

import psycopg
from psycopg.rows import dict_row

# просто небольшая проверка на параметр, например проверка параметра для id для запроса
def CHECK_PAR_INT_OR_STR(par_for_check : str|int, answer_if_error : str):
    if not isinstance(par_for_check, (str, int)):
        return [False, answer_if_error, 0]
    if not str(par_for_check).isdecimal():
        return [False, answer_if_error, 1]
    if not int(par_for_check) > 0:
        return [False, answer_if_error, 2]
    return True

# проверка на то что нам передали именно список состоящий только из str
def CHECK_PAR_LIST_OF_STR(par_for_check : list[str], answer_if_error : str):
    if not isinstance(par_for_check, list):
        return [False, answer_if_error, 3]
    if len(par_for_check) == 0:
        return [False, answer_if_error, 4]
    if not all(isinstance(item, str) for item in par_for_check):
        return [False, answer_if_error, 5]
    return True

# проверка что нам переделаи лист из int
def CHECK_PAR_LIST_OF_INT(par_for_check : list[int], answer_if_error : str):
    if not isinstance(par_for_check, list):
        return [False, answer_if_error, 6]
    if len(par_for_check) == 0:
        return [False, answer_if_error, 7]
    if not all(isinstance(item, int) for item in par_for_check):
        return [False, answer_if_error, 8]
    for par in par_for_check: 
        if par <= 0: return [False, answer_if_error, 9]
    
# подключение к БД
def get_db():
    with psycopg.connect(DSN, row_factory=dict_row) as conn:
        yield conn