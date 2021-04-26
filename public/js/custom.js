$(document).ready(function (){
    /* 장소 추가 페이지*/
    $('#sample6_address').on('propertychange change keyup paste input', function(){// 위도 경도 계산
        let address = $('#sample6_address').val();
        let detailAddress = $('#sample6_detailAddress').val();

        // 주소-좌표 변환 객체를 생성합니다
        var geocoder = new kakao.maps.services.Geocoder();
        // 주소로 좌표를 검색합니다
        geocoder.addressSearch(address + " " + detailAddress, function(result, status) {

            // 정상적으로 검색이 완료됐으면
            if (status === kakao.maps.services.Status.OK) {
                console.log(result[0].y);
                $('#latitude').val(result[0].y);
                $('#longitude').val(result[0].x);
            }
        });
    })
    $('#form_description').on('propertychange change keyup paste input',function (){ // textarea 에서 태그 찾기
        let target = $('#form_description');
        checkTag(target);
    })
})


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
                    console.log("이미존재"+tagBox.children().eq(j).text())
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





function sample6_execDaumPostcode() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

            // 각 주소의 노출 규칙에 따라 주소를 조합한다.
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
            var addr = ''; // 주소 변수
            var extraAddr = ''; // 참고항목 변수

            //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }

            // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
            if(data.userSelectedType === 'R'){
                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddr += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if(extraAddr !== ''){
                    extraAddr = ' (' + extraAddr + ')';
                }
                // 조합된 참고항목을 해당 필드에 넣는다.
                document.getElementById("sample6_extraAddress").value = extraAddr;

            } else {
                document.getElementById("sample6_extraAddress").value = '';
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            document.getElementById('sample6_postcode').value = data.zonecode;
            document.getElementById("sample6_address").value = addr;
            // 커서를 상세주소 필드로 이동한다.
            document.getElementById("sample6_detailAddress").focus();

             if ($('#sample6_address').is('input:text') && arguments.length >= 1) {
             // this is input type=text setter
                 $('#sample6_address').trigger("input");
             }
        }
    }).open();
}
