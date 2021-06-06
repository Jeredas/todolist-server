class Router{
  constructor(){
    this.routes = [];
    this.defaultRoute = ()=>{
      return new Promise((resolve, reject)=>{
        resolve('default');
      });
    }
  }

  route(name, params, userData){
    let currentRoute = this.routes.find(route=>{
      return route.name == name;
    });
    if (currentRoute){
      return currentRoute.func(params, userData);
    } else {
      return this.defaultRoute();
    }
  }
  
  addRoute(name, func){
    this.routes.push({name: name, func: func});
  }
}

module.exports = new Router();