let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let analyser;
let bufferLength;
let dataArray;

let activeNotes = {};
let pendingReleases = {};

let outputGain = null;
let carrierVolume = null;

function initializeAudio() {
    console.log("[DEBUG] initializeAudio called. Creating/checking nodes...");
    if (!outputGain) {
        console.log("[DEBUG] Creating outputGain node.");
        outputGain = audioContext.createGain();
        outputGain.gain.value = 0.3;
        outputGain.connect(audioContext.destination);
    }
    if (!analyser) {
        console.log("[DEBUG] Creating analyser node.");
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        console.log("[DEBUG] Connecting outputGain to analyser.");
        outputGain.connect(analyser);
    }
     if (!carrierVolume) {
         console.log("[DEBUG] Creating carrierVolume node.");
         carrierVolume = audioContext.createGain();
     }
    console.log("[DEBUG] initializeAudio finished.");
}


document.body.addEventListener("click", () => {
    if (audioContext.state !== "running") {
        audioContext.resume().then(() => {
            console.log("AudioContext resumed.");
            initializeAudio();
            if (carrierVolume && carrierVolumeControl) {
                 carrierVolume.gain.value = parseFloat(carrierVolumeControl.value);
            }
             console.log("[DEBUG] Starting Oscilloscope draw loop after context resume.");
             drawOscilloscope();
        });
    }
}, { once: true });

const controlsContainer = document.createElement("div");
controlsContainer.innerHTML = `
   <fieldset>
   <canvas id="oscilloscope" width="700" height="200" ></canvas>
   </fieldset>
   <fieldset>
   <label>Carrier Ratio: <input type="range" id="carrierRatio" min="0.1" max="10" step="0.1" value="1">
        <span id="carrierRatioValue">1.00</span>
    </label>
    <label>Carrier Attack: <input type="range" id="attack" min="0" max="2" step="0.01" value="0.0">
        <span id="attackValue">0.00</span>
    </label>
    <label>Carrier Decay: <input type="range" id="decay" min="0" max="2" step="0.01" value="0.05">
        <span id="decayValue">0.05</span>
    </label>
    
    <label>Carrier Sustain: <input type="range" id="sustain" min="0" max="1" step="0.01" value="0.0">
        <span id="sustainValue">0.00</span>
    </label>
    <label>Carrier Release: <input type="range" id="release" min="0" max="2" step="0.01" value="0.5">
        <span id="releaseValue">0.50</span>
    </label>
    </fieldset>
    <br>
    <fieldset>
    <label>Modulator A Ratio: <input type="range" id="ratio" min="0.1" max="10" step="0.1" value="1">
        <span id="ratioValue">1.00</span>
    </label>
    <label>Modulator A Attack: <input type="range" id="modAttack" min="0" max="2" step="0.01" value="0.0">
        <span id="modAttackValue">0.00</span>
    </label>
    <label>Modulator A Decay: <input type="range" id="modDecay" min="0" max="2" step="0.01" value="0.05">
        <span id="modDecayValue">0.05</span>
    </label>
    
    <label>Modulator A Sustain: <input type="range" id="modSustain" min="0" max="1" step="0.01" value="0.0">
        <span id="modSustainValue">0.00</span>
    </label>
    <label>Modulator A Release: <input type="range" id="modRelease" min="0" max="2" step="0.01" value="0.5">
        <span id="modReleaseValue">0.50</span>
    </label>
    </fieldset>
    <br>
    <fieldset>
    <label>Modulator B Ratio: <input type="range" id="modBRatio" min="0.1" max="10" step="0.1" value="1">
        <span id="modBRatioValue">1.00</span>
    </label>
    <label>Modulator B Attack: <input type="range" id="modBAttack" min="0" max="2" step="0.01" value="0.0">
        <span id="modBAttackValue">0.00</span>
    </label>
    <label>Modulator B Decay: <input type="range" id="modBDecay" min="0" max="2" step="0.01" value="0.05">
        <span id="modBDecayValue">0.05</span>
    </label>
    
    <label>Modulator B Sustain: <input type="range" id="modBSustain" min="0" max="1" step="0.01" value="0.0">
        <span id="modBSustainValue">0.00</span>
    </label>
    <label>Modulator B Release: <input type="range" id="modBRelease" min="0" max="2" step="0.01" value="0.5">
        <span id="modBReleaseValue">0.50</span>
    </label>
    </fieldset>
    <br>
    <fieldset>
      <label>Modulator C Ratio: <input type="range" id="modCRatio" min="0.1" max="10" step="0.1" value="1">
          <span id="modCRatioValue">1.00</span>
      </label>
    <label>Modulator C Attack: <input type="range" id="modCAttack" min="0" max="2" step="0.01" value="0.0">
        <span id="modCAttackValue">0.00</span>
    </label>
    <label>Modulator C Decay: <input type="range" id="modCDecay" min="0" max="2" step="0.01" value="0.05">
        <span id="modCDecayValue">0.05</span>
    </label>
    
    <label>Modulator C Sustain: <input type="range" id="modCSustain" min="0" max="1" step="0.01" value="0.0">
        <span id="modCSustainValue">0.00</span>
    </label>
    <label>Modulator C Release: <input type="range" id="modCRelease" min="0" max="2" step="0.01" value="0.5">
        <span id="modCReleaseValue">0.50</span>
    </label>
    </fieldset>
    <br>
    <fieldset>
    <label>Carrier Volume: <input type="range" id="carrierVolume" min="0" max="0.7" step="0.01" value="0.5">
        <span id="carrierVolumeValue">0.50</span>
    </label>
    <label>Modulator A Volume: <input type="range" id="modAVolume" min="0" max="1" step="0.01" value="0.5">
        <span id="modAVolumeValue">0.50</span>
    </label>
    <label>Modulator B Volume: <input type="range" id="modBVolume" min="0" max="1" step="0.01" value="0.5">
        <span id="modBVolumeValue">0.50</span>
    </label>
    <label>Modulator C Volume: <input type="range" id="modCVolume" min="0" max="1" step="0.01" value="0.5">
        <span id="modCVolumeValue">0.50</span>
    </label>
    </fieldset>
    <br>
    <fieldset>
        <label>Algorithm:
        <select id="algorithm">
            <option value="1">1: Stack (C>B>A>Out)</option>
            <option value="2">2: Parallelish (C>B>Out, A>Out)</option>
            <option value="3">3: Split (C>B, B>Out, A>Out)</option>
            <option value="4">4: Double Stack? (C>B>A>Out)</option>
            <option value="5">5: Triple Stack? (C>B>A>Out)</option>
            <option value="6">6: Parallel (A,B,C > Out)</option>
            <option value="7">7: Feedback Parallel (C>B>Out, A>Out, C>C)</option>
            <option value="8">8: Linear Chain (A>B>C>Out)</option>
        </select>
    </label>
    <label>Mod Index Scale: <input type="range" id="modIndex" min="0" max="1000" step="10" value="100">
            <span id="modIndexValue">100</span>
        </label>
    <label>Envelope Scale: <input type="range" id="envScale" min="0.1" max="3" step="0.1" value="1">
        <span id="envScaleValue">1.00</span>
    </label>
    <button id="panicButton" style="background: red; color: white; padding: 4px 8px; margin-left: 10px;">PANIC</button>
    <br>
    </fieldset>
`;
document.body.appendChild(controlsContainer);


const modIndexControl = document.getElementById("modIndex");
const modIndexValue = document.getElementById("modIndexValue");
const carrierRatioControl = document.getElementById("carrierRatio");
const carrierRatioValue = document.getElementById("carrierRatioValue");
const ratioControl = document.getElementById("ratio");
const ratioValue = document.getElementById("ratioValue");
const attackControl = document.getElementById("attack");
const attackValue = document.getElementById("attackValue");
const decayControl = document.getElementById("decay");
const decayValue = document.getElementById("decayValue");
const sustainControl = document.getElementById("sustain");
const sustainValue = document.getElementById("sustainValue");
const releaseControl = document.getElementById("release");
const releaseValue = document.getElementById("releaseValue");

const modAttackControl = document.getElementById("modAttack");
const modAttackValue = document.getElementById("modAttackValue");
const modDecayControl = document.getElementById("modDecay");
const modDecayValue = document.getElementById("modDecayValue");
const modSustainControl = document.getElementById("modSustain");
const modSustainValue = document.getElementById("modSustainValue");
const modReleaseControl = document.getElementById("modRelease");
const modReleaseValue = document.getElementById("modReleaseValue");

const modBRatioControl = document.getElementById("modBRatio");
const modBRatioValue = document.getElementById("modBRatioValue");
const modBAttackControl = document.getElementById("modBAttack");
const modBAttackValue = document.getElementById("modBAttackValue");
const modBDecayControl = document.getElementById("modBDecay");
const modBDecayValue = document.getElementById("modBDecayValue");
const modBSustainControl = document.getElementById("modBSustain");
const modBSustainValue = document.getElementById("modBSustainValue");
const modBReleaseControl = document.getElementById("modBRelease");
const modBReleaseValue = document.getElementById("modBReleaseValue");

const modCRatioControl = document.getElementById("modCRatio");
const modCRatioValue = document.getElementById("modCRatioValue");
const modCAttackControl = document.getElementById("modCAttack");
const modCAttackValue = document.getElementById("modCAttackValue");
const modCDecayControl = document.getElementById("modCDecay");
const modCDecayValue = document.getElementById("modCDecayValue");
const modCSustainControl = document.getElementById("modCSustain");
const modCSustainValue = document.getElementById("modCSustainValue");
const modCReleaseControl = document.getElementById("modCRelease");
const modCReleaseValue = document.getElementById("modCReleaseValue");

const carrierVolumeControl = document.getElementById("carrierVolume");
const carrierVolumeValue = document.getElementById("carrierVolumeValue");
const modAVolumeControl = document.getElementById("modAVolume");
const modAVolumeValue = document.getElementById("modAVolumeValue");
const modBVolumeControl = document.getElementById("modBVolume");
const modBVolumeValue = document.getElementById("modBVolumeValue");
const modCVolumeControl = document.getElementById("modCVolume");
const modCVolumeValue = document.getElementById("modCVolumeValue");
const envScaleControl = document.getElementById("envScale");
const envScaleValue = document.getElementById("envScaleValue");
const panicButton = document.getElementById("panicButton");


modIndexControl.addEventListener("input", () => modIndexValue.textContent = modIndexControl.value);
carrierRatioControl.addEventListener("input", () => carrierRatioValue.textContent = parseFloat(carrierRatioControl.value).toFixed(2));
ratioControl.addEventListener("input", () => ratioValue.textContent = parseFloat(ratioControl.value).toFixed(2));
attackControl.addEventListener("input", () => attackValue.textContent = parseFloat(attackControl.value).toFixed(2));
decayControl.addEventListener("input", () => decayValue.textContent = parseFloat(decayControl.value).toFixed(2));
sustainControl.addEventListener("input", () => sustainValue.textContent = parseFloat(sustainControl.value).toFixed(2));
releaseControl.addEventListener("input", () => releaseValue.textContent = parseFloat(releaseControl.value).toFixed(2));

modAttackControl.addEventListener("input", () => modAttackValue.textContent = parseFloat(modAttackControl.value).toFixed(2));
modDecayControl.addEventListener("input", () => modDecayValue.textContent = parseFloat(modDecayControl.value).toFixed(2));
modSustainControl.addEventListener("input", () => modSustainValue.textContent = parseFloat(modSustainControl.value).toFixed(2));
modReleaseControl.addEventListener("input", () => modReleaseValue.textContent = parseFloat(modReleaseControl.value).toFixed(2));

modBRatioControl.addEventListener("input", () => modBRatioValue.textContent = parseFloat(modBRatioControl.value).toFixed(2));
modBAttackControl.addEventListener("input", () => modBAttackValue.textContent = parseFloat(modBAttackControl.value).toFixed(2));
modBDecayControl.addEventListener("input", () => modBDecayValue.textContent = parseFloat(modBDecayControl.value).toFixed(2));
modBSustainControl.addEventListener("input", () => modBSustainValue.textContent = parseFloat(modBSustainControl.value).toFixed(2));
modBReleaseControl.addEventListener("input", () => modBReleaseValue.textContent = parseFloat(modBReleaseControl.value).toFixed(2));

modCRatioControl.addEventListener("input", () => modCRatioValue.textContent = parseFloat(modCRatioControl.value).toFixed(2));
modCAttackControl.addEventListener("input", () => modCAttackValue.textContent = parseFloat(modCAttackControl.value).toFixed(2));
modCDecayControl.addEventListener("input", () => modCDecayValue.textContent = parseFloat(modCDecayControl.value).toFixed(2));
modCSustainControl.addEventListener("input", () => modCSustainValue.textContent = parseFloat(modCSustainControl.value).toFixed(2));
modCReleaseControl.addEventListener("input", () => modCReleaseValue.textContent = parseFloat(modCReleaseControl.value).toFixed(2));

carrierVolumeControl.addEventListener("input", () => {
    let volume = parseFloat(carrierVolumeControl.value);
    if (carrierVolume) {
        carrierVolume.gain.setTargetAtTime(volume, audioContext.currentTime, 0.01);
    }
    carrierVolumeValue.textContent = volume.toFixed(2);
});
modAVolumeControl.addEventListener("input", () => modAVolumeValue.textContent = parseFloat(modAVolumeControl.value).toFixed(2));
modBVolumeControl.addEventListener("input", () => modBVolumeValue.textContent = parseFloat(modBVolumeControl.value).toFixed(2));
modCVolumeControl.addEventListener("input", () => modCVolumeValue.textContent = parseFloat(modCVolumeControl.value).toFixed(2));
envScaleControl.addEventListener("input", () => envScaleValue.textContent = parseFloat(envScaleControl.value).toFixed(2));

panicButton.addEventListener("click", allNotesOff);


let drawOscilloscope_frameCount = 0;

function drawOscilloscope() {
    if (drawOscilloscope_frameCount < 5) {
        console.log(`[DEBUG] drawOscilloscope CALLED (frame ${drawOscilloscope_frameCount})`);
    }

    requestAnimationFrame(drawOscilloscope);

    if (!analyser || !dataArray) {
        return;
    }

    analyser.getByteTimeDomainData(dataArray);

    let canvas = document.getElementById("oscilloscope");
    if (!canvas) {
        if (drawOscilloscope_frameCount === 0) {
             console.error("[DEBUG] !!!! OSCILLOSCOPE CANVAS NOT FOUND !!!! Check ID and DOM structure.");
        }
        drawOscilloscope_frameCount++;
        return;
    }

    let ctx = canvas.getContext("2d");
    if (!ctx) {
        if (drawOscilloscope_frameCount === 0) {
            console.error("[DEBUG] !!!! FAILED TO GET 2D CONTEXT FOR OSCILLOSCOPE !!!!");
        }
        drawOscilloscope_frameCount++;
        return;
    }

    if (drawOscilloscope_frameCount < 5) {
        let isFlat = dataArray.every(val => val === 128);
        if (isFlat) {
            console.log(`[DEBUG] Oscilloscope frame ${drawOscilloscope_frameCount}: Data is flat (all 128). No signal reaching analyser?`);
        } else {
             let min = 255, max = 0;
             for(let val of dataArray) {
                 if (val < min) min = val;
                 if (val > max) max = val;
             }
             console.log(`[DEBUG] Oscilloscope frame ${drawOscilloscope_frameCount}: Data range: ${min} to ${max}.`);
        }
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "Violet";
    ctx.beginPath();
    let sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        let v = dataArray[i] / 128.0;
        let y = v * canvas.height / 2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    drawOscilloscope_frameCount++;
}

if (audioContext.state === 'running') {
    console.log("[DEBUG] AudioContext already running. Initializing audio and starting oscilloscope.");
    initializeAudio();
    drawOscilloscope();
} else {
     console.log("[DEBUG] AudioContext not running. Oscilloscope will start after user interaction.");
}


function createFMSynth(frequency) {
    initializeAudio();

    const now = audioContext.currentTime;
    const envScale = parseFloat(envScaleControl.value);

    let carrier = audioContext.createOscillator();
    let modulatorA = audioContext.createOscillator();
    let modulatorB = audioContext.createOscillator();
    let modulatorC = audioContext.createOscillator();

    let envelope = audioContext.createGain();
    let modEnvelopeA = audioContext.createGain();
    let modEnvelopeB = audioContext.createGain();
    let modEnvelopeC = audioContext.createGain();

    let modGainA = audioContext.createGain();
    let modGainB = audioContext.createGain();
    let modGainC = audioContext.createGain();

    carrier.frequency.setValueAtTime(frequency * parseFloat(carrierRatioControl.value), now);
    modulatorA.frequency.setValueAtTime(frequency * parseFloat(ratioControl.value), now);
    modulatorB.frequency.setValueAtTime(frequency * parseFloat(modBRatioControl.value), now);
    modulatorC.frequency.setValueAtTime(frequency * parseFloat(modCRatioControl.value), now);

    const modIndexScale = parseFloat(modIndexControl.value);
    modGainA.gain.setValueAtTime(modIndexScale * parseFloat(modAVolumeControl.value) * frequency, now);
    modGainB.gain.setValueAtTime(modIndexScale * parseFloat(modBVolumeControl.value) * frequency, now);
    modGainC.gain.setValueAtTime(modIndexScale * parseFloat(modCVolumeControl.value) * frequency, now);

    const connectModulator = (modOsc, modEnv, modGain, targetParam) => {
        modOsc.connect(modEnv);
        modEnv.connect(modGain);
        modGain.connect(targetParam);
    };

    try { modulatorA.disconnect(); } catch(e) {}
    try { modulatorB.disconnect(); } catch(e) {}
    try { modulatorC.disconnect(); } catch(e) {}
    try { modEnvelopeA.disconnect(); } catch(e) {}
    try { modEnvelopeB.disconnect(); } catch(e) {}
    try { modEnvelopeC.disconnect(); } catch(e) {}
    try { modGainA.disconnect(); } catch(e) {}
    try { modGainB.disconnect(); } catch(e) {}
    try { modGainC.disconnect(); } catch(e) {}
    try { carrier.disconnect(); } catch(e) {}
    try { envelope.disconnect(); } catch(e) {}


    let algorithm = parseInt(document.getElementById("algorithm").value);

    switch (algorithm) {
        case 1:
            connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, modulatorA.frequency);
            connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            break;
        case 2:
             connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
             connectModulator(modulatorB, modEnvelopeB, modGainB, carrier.frequency);
             connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            break;
        case 3:
             connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
             connectModulator(modulatorB, modEnvelopeB, modGainB, carrier.frequency);
             connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            break;
        case 4:
            connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, modulatorA.frequency);
            connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            break;
        case 5:
            connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, modulatorA.frequency);
            connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            break;
        case 6:
            connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, carrier.frequency);
            connectModulator(modulatorC, modEnvelopeC, modGainC, carrier.frequency);
            break;
        case 7:
            connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, carrier.frequency);
            connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorC.frequency);
            break;
        case 8:
            connectModulator(modulatorA, modEnvelopeA, modGainA, modulatorB.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, modulatorC.frequency);
            connectModulator(modulatorC, modEnvelopeC, modGainC, carrier.frequency);
            break;
        default:
             console.warn(`Unknown algorithm ${algorithm}, defaulting to stack.`);
            connectModulator(modulatorC, modEnvelopeC, modGainC, modulatorB.frequency);
            connectModulator(modulatorB, modEnvelopeB, modGainB, modulatorA.frequency);
            connectModulator(modulatorA, modEnvelopeA, modGainA, carrier.frequency);
            break;
    }

    carrier.connect(carrierVolume);
    carrierVolume.gain.setValueAtTime(parseFloat(carrierVolumeControl.value), now);
    carrierVolume.connect(envelope);

    console.log("[DEBUG] Connecting voice envelope to outputGain node.");
    envelope.connect(outputGain);

    const applyADSR = (gainParam, attack, decay, sustain) => {
        gainParam.cancelScheduledValues(now);
        gainParam.setValueAtTime(0, now);
        gainParam.linearRampToValueAtTime(1, now + attack * envScale);
        gainParam.linearRampToValueAtTime(sustain, now + (attack + decay) * envScale);
    };

    applyADSR(envelope.gain,
              parseFloat(attackControl.value),
              parseFloat(decayControl.value),
              parseFloat(sustainControl.value));

    applyADSR(modEnvelopeA.gain,
              parseFloat(modAttackControl.value),
              parseFloat(modDecayControl.value),
              parseFloat(modSustainControl.value));

    applyADSR(modEnvelopeB.gain,
              parseFloat(modBAttackControl.value),
              parseFloat(modBDecayControl.value),
              parseFloat(modBSustainControl.value));

    applyADSR(modEnvelopeC.gain,
              parseFloat(modCAttackControl.value),
              parseFloat(modCDecayControl.value),
              parseFloat(modCSustainControl.value));

    carrier.start(now);
    modulatorA.start(now);
    modulatorB.start(now);
    modulatorC.start(now);

    return {
        carrier,
        modulatorA,
        modulatorB,
        modulatorC,
        modGainA,
        modGainB,
        modGainC,
        envelope,
        modEnvelopeA,
        modEnvelopeB,
        modEnvelopeC,
        carrierVolumeNode: carrierVolume,
        frequency,
        cleanupTimeout: null
    };
}

function releaseNote(note) {
    if (!activeNotes[note]) {
        return;
    }

    const voice = activeNotes[note];
    const now = audioContext.currentTime;
    const releaseTime = now;
    pendingReleases[note] = releaseTime;

    const envScale = parseFloat(envScaleControl.value);

    const carrierReleaseVal = parseFloat(releaseControl.value) * envScale;
    const modAReleaseVal = parseFloat(modReleaseControl.value) * envScale;
    const modBReleaseVal = parseFloat(modBReleaseControl.value) * envScale;
    const modCReleaseVal = parseFloat(modCReleaseControl.value) * envScale;

    const applyRelease = (gainParam, releaseDuration) => {
         gainParam.cancelScheduledValues(now);
         gainParam.setValueAtTime(gainParam.value, now);
         gainParam.linearRampToValueAtTime(0.0001, now + releaseDuration);
    };

    applyRelease(voice.envelope.gain, carrierReleaseVal);

    if (voice.modEnvelopeA) applyRelease(voice.modEnvelopeA.gain, modAReleaseVal);
    if (voice.modEnvelopeB) applyRelease(voice.modEnvelopeB.gain, modBReleaseVal);
    if (voice.modEnvelopeC) applyRelease(voice.modEnvelopeC.gain, modCReleaseVal);

    if (voice.cleanupTimeout) {
        clearTimeout(voice.cleanupTimeout);
    }

    const longestRelease = Math.max(carrierReleaseVal, modAReleaseVal, modBReleaseVal, modCReleaseVal);
    const cleanupDelay = longestRelease * 1000 + 100;

    voice.cleanupTimeout = setTimeout(() => {
        if (pendingReleases[note] === releaseTime && activeNotes[note] === voice) {
            try {
                voice.carrier.stop();
                voice.modulatorA.stop();
                voice.modulatorB.stop();
                voice.modulatorC.stop();
                 voice.carrier.disconnect();
                 voice.modulatorA.disconnect();
                 voice.modulatorB.disconnect();
                 voice.modulatorC.disconnect();
                 voice.envelope.disconnect();
                 voice.modEnvelopeA.disconnect();
                 voice.modEnvelopeB.disconnect();
                 voice.modEnvelopeC.disconnect();
                 voice.modGainA.disconnect();
                 voice.modGainB.disconnect();
                 voice.modGainC.disconnect();
            } catch (err) {
                console.warn(`Error stopping/disconnecting oscillators during cleanup for note ${note}:`, err);
            } finally {
                delete activeNotes[note];
                delete pendingReleases[note];
                updateOutputGain();
            }
        } else {
        }
    }, cleanupDelay);
}

navigator.requestMIDIAccess().then(midiAccess => {
    if (midiAccess.inputs.size === 0) {
        console.warn("No MIDI input devices found.");
        return;
    }
    console.log("MIDI Ready!");
    midiAccess.inputs.forEach(input => {
        console.log(`Listening to MIDI Input: ${input.name}`);
        input.onmidimessage = (message) => {
             if (audioContext.state !== "running") {
                 audioContext.resume().then(() => {
                     console.log("AudioContext resumed via MIDI.");
                     initializeAudio();
                     if (carrierVolume && carrierVolumeControl) {
                          carrierVolume.gain.value = parseFloat(carrierVolumeControl.value);
                     }
                     if (drawOscilloscope_frameCount === 0) {
                         console.log("[DEBUG] Starting Oscilloscope draw loop after MIDI resume.");
                         drawOscilloscope();
                     }
                 });
             }

            let [command, note, velocity] = message.data;
            let frequency = 440 * Math.pow(2, (note - 69) / 12);
            const now = audioContext.currentTime;

            if (command === 144 && velocity > 0) {

                if (activeNotes[note]) {
                    const oldVoice = activeNotes[note];
                    delete pendingReleases[note];
                    if (oldVoice.cleanupTimeout) {
                        clearTimeout(oldVoice.cleanupTimeout);
                        oldVoice.cleanupTimeout = null;
                    }

                    const fadeTime = 0.005;
                    try {
                        oldVoice.envelope.gain.cancelScheduledValues(now);
                        oldVoice.envelope.gain.setValueAtTime(oldVoice.envelope.gain.value, now);
                        oldVoice.envelope.gain.linearRampToValueAtTime(0.0001, now + fadeTime);

                        if (oldVoice.modEnvelopeA) { oldVoice.modEnvelopeA.gain.cancelScheduledValues(now); oldVoice.modEnvelopeA.gain.setValueAtTime(oldVoice.modEnvelopeA.gain.value, now); oldVoice.modEnvelopeA.gain.linearRampToValueAtTime(0.0001, now + fadeTime); }
                        if (oldVoice.modEnvelopeB) { oldVoice.modEnvelopeB.gain.cancelScheduledValues(now); oldVoice.modEnvelopeB.gain.setValueAtTime(oldVoice.modEnvelopeB.gain.value, now); oldVoice.modEnvelopeB.gain.linearRampToValueAtTime(0.0001, now + fadeTime); }
                        if (oldVoice.modEnvelopeC) { oldVoice.modEnvelopeC.gain.cancelScheduledValues(now); oldVoice.modEnvelopeC.gain.setValueAtTime(oldVoice.modEnvelopeC.gain.value, now); oldVoice.modEnvelopeC.gain.linearRampToValueAtTime(0.0001, now + fadeTime); }

                        const stopDelay = fadeTime * 1000 + 10;
                        setTimeout(() => {
                            try {
                                oldVoice.carrier.stop(); oldVoice.modulatorA.stop(); oldVoice.modulatorB.stop(); oldVoice.modulatorC.stop();
                            } catch (err) {}
                        }, stopDelay);

                    } catch (err) {
                        console.warn("Error applying quick fade during retrigger:", err);
                        try {
                             if (oldVoice.carrier) oldVoice.carrier.stop(); if (oldVoice.modulatorA) oldVoice.modulatorA.stop(); if (oldVoice.modulatorB) oldVoice.modulatorB.stop(); if (oldVoice.modulatorC) oldVoice.modulatorC.stop();
                        } catch(stopErr) {}
                    }
                } else {
                     delete pendingReleases[note];
                }

                const newVoice = createFMSynth(frequency);
                activeNotes[note] = newVoice;
                updateOutputGain();

            } else if (command === 128 || (command === 144 && velocity === 0)) {
                releaseNote(note);
            }
        };
    });
}).catch(err => {
     console.error("MIDI Access Error:", err);
     alert("Could not access MIDI devices. Please ensure permissions are granted.");
});

function updateOutputGain() {
    if (!outputGain) return;

    const voiceCount = Object.keys(activeNotes).length;
    const now = audioContext.currentTime;
    let targetGain;

    if (voiceCount === 0) {
        targetGain = 0.3;
    } else {
        const maxGain = 0.5;
        targetGain = maxGain / Math.pow(voiceCount, 0.8);
    }

    outputGain.gain.setTargetAtTime(targetGain, now, 0.02);
}

function allNotesOff() {
    const noteNumbers = Object.keys(activeNotes);
    console.log(`PANIC! Stopping ${noteNumbers.length} active notes.`);
    const now = audioContext.currentTime;
    const fadeTime = 0.02;

    noteNumbers.forEach(note => {
        const voice = activeNotes[note];
        if (voice) {
             try {
                 if (voice.cleanupTimeout) { clearTimeout(voice.cleanupTimeout); voice.cleanupTimeout = null; }

                 voice.envelope.gain.cancelScheduledValues(now);
                 voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
                 voice.envelope.gain.linearRampToValueAtTime(0.0001, now + fadeTime);
                 if (voice.modEnvelopeA) { voice.modEnvelopeA.gain.cancelScheduledValues(now); voice.modEnvelopeA.gain.setValueAtTime(voice.modEnvelopeA.gain.value, now); voice.modEnvelopeA.gain.linearRampToValueAtTime(0.0001, now + fadeTime); }
                 if (voice.modEnvelopeB) { voice.modEnvelopeB.gain.cancelScheduledValues(now); voice.modEnvelopeB.gain.setValueAtTime(voice.modEnvelopeB.gain.value, now); voice.modEnvelopeB.gain.linearRampToValueAtTime(0.0001, now + fadeTime); }
                 if (voice.modEnvelopeC) { voice.modEnvelopeC.gain.cancelScheduledValues(now); voice.modEnvelopeC.gain.setValueAtTime(voice.modEnvelopeC.gain.value, now); voice.modEnvelopeC.gain.linearRampToValueAtTime(0.0001, now + fadeTime); }

                 const stopDelay = fadeTime * 1000 + 10;
                 setTimeout(() => {
                      try { voice.carrier.stop(); voice.modulatorA.stop(); voice.modulatorB.stop(); voice.modulatorC.stop(); } catch(e) {}
                 }, stopDelay);

             } catch (err) {
                 console.warn("Error during panic fade out:", err);
                 try {
                     if (voice.carrier) voice.carrier.stop(now); if (voice.modulatorA) voice.modulatorA.stop(now); if (voice.modulatorB) voice.modulatorB.stop(now); if (voice.modulatorC) voice.modulatorC.stop(now);
                 } catch(stopErr) {}
             }
        }
    });

    activeNotes = {};
    pendingReleases = {};

    if (outputGain) {
        outputGain.gain.cancelScheduledValues(now);
        outputGain.gain.setValueAtTime(outputGain.gain.value, now);
        outputGain.gain.linearRampToValueAtTime(0, now + fadeTime);
        outputGain.gain.linearRampToValueAtTime(0.3, now + fadeTime + 0.05);
    }
    console.log("Panic complete. All notes stopped.");
}
