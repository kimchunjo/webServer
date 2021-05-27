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
    try:
        return model.most_similar(positive=key)
    except KeyError:
        if len(key) == 3:
            key =[ key[0] , key[1] ]
            return predict(key)
        elif len(key) == 2:
            key =[ key[0] ]
            return predict(key)
        elif len(key) == 1:
            return "not in vocabulary"

if __name__ == '__main__':
    data = []
    for v in range(1, len(sys.argv)):
        data.append(json.loads(sys.argv[v])['name'])
    result = predict(data)
    print(json.dumps(result))
