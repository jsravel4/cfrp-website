$(function(){
  
  if( $("#footer-wrapper").position().top + $( "#footer-wrapper").height() < $( window ).height() )
  {
    $( "#footer-wrapper" ).css({"position":"absolute", "bottom":"0px", "width":"100%"});
  }
  
});