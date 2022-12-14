import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GridMapHelper } from '../../helpers/GridMapHelper'
import 
{
    degreeToRadians,
    resizeCanvasToDisplaySize,
    rotateActorLeft,
    rotateActorRight,
    sceneProperties, 
    translateActorBackward, 
    translateActorFoward,
    printOnConsole,
    loadGLBFile,
    loadOBJFile
} from '../../helpers/Util'
import {editor,readOnlyState} from '../../components/global/editor'
import { parseCode } from '../../level2/level2Parser'

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(45, 2, 1, 1000)
camera.position.set(0,15,30)

const renderer = new THREE.WebGLRenderer({canvas: document.getElementById("sceneView")})

window.addEventListener( 'resize', function(){
    resizeCanvasToDisplaySize(renderer,camera);
}, false );

const ambientLight = new THREE.HemisphereLight('white','darkslategrey',0.5)

const mainLight = new THREE.DirectionalLight('white',0.7)
mainLight.position.set(2,1,1)

const controls = new OrbitControls(camera, renderer.domElement)

const gridMapHelper = new GridMapHelper()

const plane = gridMapHelper.createGridPlane()

var actorModelPath = new URL('../../../assets/models/eve.glb',import.meta.url).toString()
const actor = new THREE.Object3D()
loadGLBFile(actor,actorModelPath,"eve",2.0)
actor.position.set(gridMapHelper.getGlobalXPositionFromCoord(0),1.0,gridMapHelper.getGlobalZPositionFromCoord(5))
actor.rotateY(degreeToRadians(90))

const objective = new THREE.Object3D()
var crystalModelPath = new URL('../../../assets/models/crystal.obj',import.meta.url).toString()
var crystalTexturePath = new URL('../../../assets/textures/crystal.jpg',import.meta.url).toString()
loadOBJFile(objective,crystalModelPath,'crystal',crystalTexturePath,2.0)
objective.rotateX(degreeToRadians(-90))
objective.position.set(gridMapHelper.getGlobalXPositionFromCoord(9),0.0,gridMapHelper.getGlobalZPositionFromCoord(5))

const boxGeometry = new THREE.BoxGeometry(20,1,2)
const boxMaterial = new THREE.MeshLambertMaterial({color: "rgb(0,255,0)"})
const box1 = new THREE.Mesh(boxGeometry,boxMaterial)
const box2 = new THREE.Mesh(boxGeometry,boxMaterial)
box1.position.set(gridMapHelper.getGlobalXPositionFromCoord(4.5),0.5,gridMapHelper.getGlobalZPositionFromCoord(4))
box2.position.set(gridMapHelper.getGlobalXPositionFromCoord(4.5),0.5,gridMapHelper.getGlobalZPositionFromCoord(6))
gridMapHelper.addObstacle(0,9,4,4)
gridMapHelper.addObstacle(0,9,6,6)

const trapGeometry = new THREE.BoxGeometry(2,1,2)
const trapMaterial = new THREE.MeshLambertMaterial({color: "rgb(255,0,0)"})
const trap = new THREE.Mesh(trapGeometry,trapMaterial)
trap.position.set(gridMapHelper.getGlobalXPositionFromCoord(5),0.5,gridMapHelper.getGlobalZPositionFromCoord(5))

scene.add(ambientLight)
scene.add(mainLight)
scene.add(plane)
scene.add(objective)
scene.add(actor)
scene.add(box1)
scene.add(box2)
scene.add(trap)

gridMapHelper.addFireHole(5,5)

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

async function andarFrente(amount)
{
    await translateActorFoward(actor,amount,gridMapHelper,sceneProperties)
}

async function andarTras(amount)
{
    await translateActorBackward(actor,amount,gridMapHelper,sceneProperties)
}

async function girarDireita()
{
    await rotateActorRight(actor,sceneProperties)
}

async function girarEsquerda()
{
    await rotateActorLeft(actor,sceneProperties)
}

function pegandoFogo()
{
    if(gridMapHelper.detectHole(actor.position) != null)
    {
        return true
    }
    else
    {
        return false
    }
}

function apagarFogoECobrirBuraco()
{
    if(gridMapHelper.deactivateHole(actor.position,'fire'))
    {
        trap.visible = false
    }
}

function cobrirBuraco()
{
    if(gridMapHelper.deactivateHole(actor.position))
    {
        trap.visible = false
    }
}

function checkCollision(object1,object2)
{
    if(gridMapHelper.getXCoordFromGlobalPosition(object1.position.x) == gridMapHelper.getXCoordFromGlobalPosition(object2.position.x) && gridMapHelper.getZCoordFromGlobalPosition(object1.position.z) == gridMapHelper.getZCoordFromGlobalPosition(object2.position.z))
    {
        return true
    }
    else
    {
        return false
    }
}

function coletarCristal()
{
    if(sceneProperties.cancelExecution)
    {
        return
    }

    if(checkCollision(actor,objective))
    {
        objective.visible = false
        printOnConsole("Cristal coletado com sucesso.")
    }
    else
    {
        printOnConsole("Rob?? n??o est?? sobre o cristal.")
    }
}

function resetLevel()
{
    actor.position.set(gridMapHelper.getGlobalXPositionFromCoord(0),1.0,gridMapHelper.getGlobalZPositionFromCoord(5))
    actor.rotation.set(0,degreeToRadians(90),0)
    actor.getObjectByName('eve').rotation.set(0,0,0)
    gridMapHelper.restartHoles()
    trap.visible = true
    objective.visible = true
}

function winCondition()
{
    if(checkCollision(actor,objective) && !objective.visible)
    {
        return true
    }
    else
    {
        return false
    }
}

const execBtn = document.getElementById("execute")
execBtn.addEventListener("click",async function(){
    let codeParsed = parseCode(editor.state.doc.toString(),10)
    sceneProperties.cancelExecution = false
    if(codeParsed != null)
    {
        resetLevel()
        document.getElementById("execute").disabled = true
        await eval(codeParsed)
        if(winCondition())
        {
            readOnlyState.doc = editor.state.doc
            editor.setState(readOnlyState)
            document.getElementById('winMessage').classList.remove('invisible')
            document.getElementById('advanceBtn').classList.remove('invisible')
            document.getElementById("reset").disabled = true
        }
        else
        {
            document.getElementById("execute").disabled = false
        }
    }
})

const resetBtn = document.getElementById("reset")
resetBtn.addEventListener("click",function(){
    sceneProperties.cancelExecution = true
    resetLevel()
})

const clsConsoleBtn = document.getElementById("clsConsole")
clsConsoleBtn.addEventListener("click",function(){
    document.getElementById("console-printing").innerHTML = null
})

resizeCanvasToDisplaySize(renderer,camera)
animate()