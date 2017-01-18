'use strict'
if (!Number.EPSILON) {
    Number.EPSILON = 2.220446049250313e-16;
}

//better random numbers
function getRandomInt(min, max) {
    const maxAux = max == 0 ? 0 : max - 1;
    const byteArray = new Uint8Array(1);
    crypto.getRandomValues(byteArray);

    const range = maxAux - min + 1;
    const maxRange = 256;
    return byteArray[0] >= Math.floor(maxRange / range) * range ?
        getRandomInt(min, maxAux) :
        min + (byteArray[0] % range);
}

function setOneTouchAtAtime() {
    //allow only single touch
    var isTouched = false;
    const $document = $(document);
    $document.on('touchstart', function() {
        if (isTouched) return;
        isTouched = true;
        $document.off('touchstart', () =>
            $document.on('touchend', function() {
                isTouched = false;
                $document.bind('touchstart');
            }));
    });
}

const arrayIntFromString = (arr) => {
    if (!arr.split) return null;
    return arr.split(',').map(el => parseInt(el))
};


function transposeMap(matrix) {
    const newMatrix = {};
    for (let rowInt = 0; rowInt < dimensions[0]; rowInt++) {
        for (let columnInt = 0; columnInt < dimensions[1]; columnInt++) {
            newMatrix[[columnInt, rowInt]] = matrix[[rowInt, columnInt]]
        }
    }
    return newMatrix;
}

function weightedRandSum (spec, all=1) {
    let sum = 0,
        r = Math.random() * all;
    for (let specObj of spec) {
        sum += specObj.prob;
        if (r <= sum) return specObj.value;
    }
    if (Math.abs(sum - 1) < 0.0000001 /*Number.EPSILON*/) throw new Error('probability sum is not equal 1')
}

// weightedRand2( [{ value: 0, prob :0.8}, {value : 1,  prob :0.1}, {value : 2, prob: 0.1}] )
