import {test,request} from "@playwright/test";

export class APIutils{
    constructor(apiContext,loginCredential){

    this.apiContext=apiContext,
    this.loginCredential=loginCredential
    }
    //fat arrow function not supporting in class
async getToken(){
 const response= await this.apiContext.post('https://api.eventhub.rahulshettyacademy.com/api/auth/login',
    {
        data:this.loginCredential,
    headers:{
        'content-type' :'application/json'
    }
}
 )
const responseJson=await response.json();
return responseJson.token;
}
}