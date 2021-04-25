function checkPassword(){
    let password = $('#loginPassword').val();
    let password2 = $('#loginPassword2').val();
    if(password===password2 && password !==""){
        let submitBtn = $('#signupSubmit').removeClass('btn-muted').addClass('btn-primary').removeAttr('disabled')
    }else{
        let notice= `<p class="text-secondary text-sm">비밀번호가 일치하지 않습니다.</p>`;
        let submitBtn = $('#signupSubmit').addClass('btn-muted').removeClass('btn-primary').attr('disabled','disabled');
    }
}