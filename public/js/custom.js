/* signup page */
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

/* user-add-1 page */
function checkTag(self){
    let text = $(self).val();
    let textArray = text.split(" ");
    let tagArray= new Array();

    for(let i = 0; i< textArray.length; i++){
        let temp="";
        let tag=false;
        for(let j=0; j< textArray[i].length; j++){
            if(tag === true){
                temp +=textArray[i][j];
            }
            if(textArray[i][j] == "#"){
                tag = true
            }
        }
        tagArray[i] = temp;
    }


    /* 새롭게 추가된 태그를 넣는다. */
    for(let i=0;i<tagArray.length;i++){
        if(tagArray[i] !== ""){
            let tag = tagArray[i]
            let tagBox = $('#description_tag_box');
            let alreadyExistsTag = false;

            for(let j=0; j< tagBox.children().length; j++){
                if(tag == tagBox.children().eq(j).text()){
                    alreadyExistsTag = true;
                    break;
                }
            }

            if(alreadyExistsTag === false){
                let html=`<span class="badge badge-secondary" style="margin-right: 3px">${tag}</span>`;
                tagBox.append(html);
            }
        }
    }

    /* 변경되거나 삭제된 태그를 처리한다. */
    let tagBox = $('#description_tag_box');
    for(let i= 0; i<tagBox.children().length; i++){
        let tag = tagBox.children().eq(i).text();
        let temp = false;
        for(let j=0; j<tagArray.length;j++){
            if(tag == tagArray[j]){
                temp= true;
                break;
            }
        }
        if(temp === false){
            tagBox.children().eq(i).remove();
        }
    }

    let temp = "";
    for(let i=0; i<tagBox.children().length;i++){
        temp =  temp + tagBox.children().eq(i).text()+" ";
        $('#hide_tag_box').text(temp);
    }
}