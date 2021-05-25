#!/usr/bin/env python
# coding: utf-8

# In[1]:

import json
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding = 'utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding = 'utf-8')

from gensim.models import Word2Vec

def predict(key):
    model = Word2Vec.load("user_history_model")
#     result = list()
#     length = len(model.most_similar(key))
#     for i in range(length):
#         result.append(model.most_similar(key)[i])
#         # result.append("@#")
    try:
            return model.most_similar(key)
    except KeyError:
            return "not in vocabulary"
    
if __name__ == '__main__':
#     print(predict(sys.argv[1]))
#     sys.stdout.flush()
    data = json.loads(sys.argv[1])['name']
    result = predict(data)
    print(json.dumps(result))
