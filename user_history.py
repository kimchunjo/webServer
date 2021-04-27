#!/usr/bin/env python
# coding: utf-8

# In[1]:


import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding = 'utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding = 'utf-8')

from gensim.models import Word2Vec

def predict(key):
    model = Word2Vec.load("user_history_model")
    return model.most_similar(key)
    
if __name__ == '__main__': 
    print(predict(sys.argv[1]))
    sys.stdout.flush()

