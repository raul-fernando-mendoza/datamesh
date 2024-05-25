#to run remoterly use
ng serve --host=192.168.1.14 --disable-host-check

#to allow the firewall to use the development port
sudo ufw allow 4200


#select the project
firebase projects:list
firebase use  datamesh-7b8b8 
firebase deploy --only firestore
firebase firestore:indexes

# for codemirror integration follow example at
https://stackblitz.com/edit/ngx-editor-codemirror?file=src%2Fmain.ts,src%2Fdoc.ts


