react-shared-components
=====================

These components can be published to our own npm registry.


**KATER PRIVATE REGISTRY**

go to the website http://kater:4873/

if there is no answer there must be a problem with the DOCKER container

* call me for help (swoboda@vrvis.at)
* login to kater to fix the problem yourself
	
	ssh kater
	
	sudo docker pull verdaccio/verdaccio
	
* fix rights as root user (the sysadmins would not like this)
	
	sudo docker run -it --rm --name verdaccio -p 4873:4873 -v /home/users/swoboda/verdaccio/conf:/verdaccio/conf -v /home/users/swoboda/verdaccio/storage:/verdaccio/storage -u root verdaccio/verdaccio chown verdaccio:verdaccio /verdaccio -R
	
* just start the container
	
	sudo docker run -d --rm --name verdaccio -p 4873:4873 -v /home/users/swoboda/verdaccio/conf:/verdaccio/conf -v /home/users/swoboda/verdaccio/storage:/verdaccio/storage verdaccio/verdaccio


**HOW TO PUBLISH**

* change the registry and log in
	
	npm set registry http://kater:4873/
	
	npm login (type your username and some password you can remember)

* browse to the folder of a component you want to publish (e.g. ./react-parallel-coordinates/)
* then type
	
	npm publish


**HOW TO USE A COMPONENT**

* change the registry
	
	npm set registry http://kater:4873/

* install a component
	
	npm i -S react-parallel-coordinates

* add this line to your package.json to set the default registry for your project
	
	"config": { "registry": "http://kater:4873/" },


**HOW TO CONTRIBUTE**

* fork the *react-shared-components* repository
* add your own component or extend an existing component
* write examples with test data
* write tests
* make a pull request to the *react-shared-components* repository
* we will double check your code and then publish it

**HOW TO BACKUP THE REGISTRY**

* login to kater
* backup these folders
	
	/home/users/swoboda/verdaccio/conf
	
	/home/users/swoboda/verdaccio/storage
	