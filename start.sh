open /Applications/Apache\ CouchDB.app &
sleep 0.5
FUSEKI_HOME=/Users/nene/apache-jena-fuseki-2.3.1 /Users/nene/apache-jena-fuseki-2.3.1/fuseki-server &
python /Users/nene/dynamicPlayerAPI/dynamicservice.py &
node /Users/nene/dynamicPlayer/server.js &
node ./server.js
