/*
**
**  filename : downfromIT
**  nodejs version : 7.5.0 (https://nodejs.org/dist/v7.5.0/)
**  code description : parse from http://www.itworld.co.kr/ main page
**    for each article's url, title, date, etc..
**  using module : cheerio, request, fs , date_utils, child_process
**  created by : CLP
**
*/
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var datapath = '/home/pi/newscrap/itworld/';
require('date-utils');
var dt = new Date();
var execSync = require('child_process').execSync;



var url = 'http://www.itworld.co.kr';//parsing url
var overlapcheck = 5;//overlap check date
request(url, function(error, response, html){

  var startyear = dt.toFormat('YYYY');
  var startmonth = dt.toFormat('MM');
  var startdate = dt.toFormat('DD');
  var starthour = dt.toFormat('HH24');
  var startminute = dt.toFormat('MI');

  var path = startyear+'/'+startmonth+'/'+startdate+starthour+startminute;
  if(!(fs.existsSync(datapath+startyear)))
    fs.mkdirSync(datapath+startyear);//파일 저장 위치 생성
    if(!(fs.existsSync(datapath+startyear+'/'+startmonth)))
      fs.mkdirSync(datapath+startyear+'/'+startmonth);//파일 저장 위치 생성
  if(!(fs.existsSync(datapath+path)))
    fs.mkdirSync(datapath+path);//파일 저장 위치 생성
    if (error) {throw error}
    else{
      var index = new Array();
      var $ = cheerio.load(html);
      $('.main_news_list').each(function(identify, element){//각 항목을 받아옴
        ////console.log("파싱 정보 : "+$(this).html());
        index[identify] = {main_article : '',sub_article : new Array()};
        /*이미지파일 받아오기*/
        var src = cheerio.load($(this).html())('.fit_image').attr("src");
        //console.log(path+'_'+identify+" sumnail img src : "+src);
        request(src).pipe(fs.createWriteStream(datapath+path+'/'+identify+'.jpg'));
        /*이미지파일 받아오기*/
        /*기사 제목 및 주소 받아오기*/
        var main_article = cheerio.load(cheerio.load($(this).html())('.news_list_title').html())('a');
        //console.log('main : '+main_article.text()+'+'+main_article.attr('href'));
        index[identify].main_article = {title : main_article.text(), address : main_article.attr('href')};//메인
        var sub_article = new Array();
        var sub_temp = cheerio.load($(this).html());

        sub_temp('.news_list_relation_title').each(function(i,elem){
          index[identify].sub_article[i] = {title : cheerio.load(sub_temp(this).html())('a').text(),address : cheerio.load(sub_temp(this).html())('a').attr('href')};
          //console.log('sub '+i+' : '+index[identify].sub_article[i].title+'+'+index[identify].sub_article[i].address);

        });
        //var intervalfunc = setInterval(function(){count++;//console.log(count);if(count>100){clearTimeout(intervalfunc);clearInterval(intervalfunc);}},10);

        //index[identify] = {main_article : {address :  , title : cheerio.load($(this).html())('.news_list_title').attr("title")},sub_article:;
        /*기사 제목 및 주소 받아오기*/
      });//각 기사 항목에 대한 작업 끝
    }

    ////console.log (html);
    var interv = setInterval(function(){
      if(function(){for(var j=0;j<index.length;j++){if(index[j].sub_article[1]==undefined)return false;}return true;}){
        //console.log('ended');

        for(var countindex = 0;countindex<index.length;countindex++){//countindex 끝까지 루프
          console.log("countindex loop");
          for(var countarticle = 0;(index[countindex].sub_article ==undefined ? false : countarticle<=(index[countindex].sub_article.length));countarticle++){//sub_article 이 undefined이거나 countarticle이 끝까지 도달할 때까지 루프
            if(!countarticle){//countarticle을 체크
              if(indexfind(index[countindex].main_article.title,overlapcheck)){//overlapcheck에 저장된 날짜만큼 중복을 검사함.
                index[countindex].main_article = undefined;
                console.log("index["+countindex+"].main_article : detected");
              }
            }else{
              if(indexfind(index[countindex].sub_article[countarticle-1].title,overlapcheck)){
                index[countindex].sub_article[countarticle-1] = undefined;
                console.log("index["+countindex+"].sub_article["+(countarticle-1)+"] : detected");
              }
            }
          }
          var ifallnull = true;
          for(var countarticle1 = 0;index[countindex].sub_article ==undefined ? false : countarticle1<index[countindex].sub_article.length;countarticle1++){
            if(index[countindex].sub_article[countarticle1]!=null||index[countindex].sub_article[countarticle1]!=undefined){
              ifallnull=false;
            }
          }
          if(ifallnull){
            index[countindex].sub_article = undefined;
          }
          if((index[countindex].main_article==undefined||index[countindex].main_article==null)&&(index[countindex].sub_article==null||index[countindex].sub_article==undefined)){
            var filecount = countindex+1;
            function filemoveloop(){
              var exists = fs.existsSync(datapath+path+'/'+filecount+'.jpg')//해당 인덱스가 존재하지 않을 경우에 수행
              console.log((exists ? "jpg file is there" : "jpg file no exist")+ ' : '+filecount+".jpg");
              if(exists){
                execSync('mv '+datapath+path+'/'+filecount+'.jpg '+datapath+path+'/'+(filecount-1)+'.jpg');
                filecount++;
                filemoveloop();
              }else{
                return;
              }
            }
            execSync('rm '+datapath+path+'/'+countindex+".jpg");
            filemoveloop();
            index = (countindex==0?index.slice(countindex+1,index[index.length]):index.slice(0,countindex-1).concat(index.slice(countindex+1,index[index.length])));
            countindex--;
          }
        }
        if(index[0] == undefined){
          execSync('rm -R '+datapath+path);
        }else{
          fs.writeFile(datapath+path+'/index.json', JSON.stringify(index), 'utf8', function(error){ console.log('write end');});
        }



        clearInterval(interv);
        clearTimeout(interv);
      }
    },100);

    //console.log('indexfind result : '+indexfind(index[0].main_article.title,5));
});
function indexfind(string, duration){//duration:일 단위
  //console.log('find for : '+string);
  var limit = Date.today().add({days:-duration});//몇일부터?
  ////console.log('to : '+limit.toFormat('YYYYMMDD'));
  var checking = Date.today();
  ////console.log('from : '+checking.toFormat('YYYYMMDD'));
  var findloop = function findloop(){
    var dirnotexist = true;
    while(dirnotexist){
      ////console.log('dirnotexist loop entered')
      try{
        var stdout = execSync('ls '+datapath+checking.toFormat('YYYY/MM')+' | grep '+checking.toFormat('DD')).toString();
          dirnotexist = false;
          ////console.log('dir exist : '+stdout);
      }
      catch(exception){
        ////console.log(exception);
        var stdout = '';
        dirnotexist = true;

      }
      if((Number(limit.toFormat('YYYYMMDD'))-1<Number(checking.toFormat('YYYYMMDD')))&&dirnotexist){
        ////console.log('nextday comes')
        checking.add({days:-1});//하루씩 차감해 나감
        return findloop();
      }else if(dirnotexist) return false;
    }
    var data = stdout.split('\n');//하루치 파일 내역

    for(var i = 0;i<data.length-1;i++){//하루 범위 내에 있는 모든 제목들을 조사함.
      var path = checking.toFormat('YYYY/MM')+'/'+data[i];
      ////console.log('finding : '+path);

      if(fs.existsSync(datapath+path+'/'+'index.json')){
        var index = JSON.parse(fs.readFileSync(datapath+path+'/'+'index.json'));
        for(var loop=0;loop<index.length;loop++){//index 파일 내 항목 갯수에 따른 루프
          ////console.log('parsed index num.0 asdf : '+JSON.stringify(index[0]));
          if(index[loop].main_article !=undefined){
            //console.log('compare : '+string+'  and  '+JSON.stringify(index[loop].main_article.title));
            if(index[loop].main_article.title == string){return true;}//메인
          }
          if(index[loop].sub_article !=undefined){
            if(index[loop].sub_article[0] !=undefined){
              //console.log('compare : '+string+'  and  '+JSON.stringify(index[loop].sub_article[0]));
              if(index[loop].sub_article[0].title == string){return true;}//서브0
            }
            if(index[loop].sub_article[1] !=undefined){
              //console.log('compare : '+string+'  and  '+JSON.stringify(index[loop].main_article[1]));
              if(index[loop].sub_article[1].title == string){return true;}//서브1
            }
          }
        }
      }else{
        //console.log('ERROR : no index file exists \nDirectory : '+datapath+path);
      }
    }
    if(Number(limit.toFormat('YYYYMMDD'))<Number(checking.toFormat('YYYYMMDD'))){
      checking.add({days:-1});//하루씩 차감해 나감
      return findloop();
    }else return false;
  }

  return findloop();
}
function indexread(filename, callback){

}
function indexread(filename, duration, selectdate){//선택된 날짜로부터 몇일동안의 기록

}
function indexsave(string, path){

}
