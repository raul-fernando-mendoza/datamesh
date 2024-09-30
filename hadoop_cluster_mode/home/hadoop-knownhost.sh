#!/bin/bash
ssh-keyscan namenode > ~/.ssh/known_hosts 
ssh-keyscan worker1 >> ~/.ssh/known_hosts 
ssh-keyscan worker2 >> ~/.ssh/known_hosts