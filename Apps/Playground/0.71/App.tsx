/**
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useState, FunctionComponent, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, Button, View, Text, ViewProps, Image, Alert } from 'react-native';

import { EngineView, useEngine, EngineViewCallbacks } from '@babylonjs/react-native';
import { Scene, Vector3, ArcRotateCamera, Camera, WebXRSessionManager, SceneLoader, TransformNode, DeviceSourceManager, DeviceType, PointerInput, WebXRTrackingState, IMouseEvent, WebXRFeatureName, IWebXRHitResult, CreateTorus, Quaternion, WebXRHitTest, FreeCamera, WebXRAnchorSystem, IPointerEvent, PickingInfo, WebXRState, DirectionalLight, ShadowGenerator } from '@babylonjs/core';
import '@babylonjs/loaders';
import Slider from '@react-native-community/slider';

const EngineScreen: FunctionComponent<ViewProps> = (props: ViewProps) => {
	const defaultScale = 1;
	const enableSnapshots = false;

	const engine = useEngine();

	const [toggleView, setToggleView] = useState(false);
	const [camera, setCamera] = useState<Camera>();
	const [rootNode, setRootNode] = useState<TransformNode>();
	const [scene, setScene] = useState<Scene>();
	const [xrSession, setXrSession] = useState<WebXRSessionManager>();
	const [scale, setScale] = useState<number>(defaultScale);
	const [snapshotData, setSnapshotData] = useState<string>();
	const [engineViewCallbacks, setEngineViewCallbacks] = useState<EngineViewCallbacks>();
	const [trackingState, setTrackingState] = useState<WebXRTrackingState>();

	useEffect(() => {
		if (engine) {
			const scene = new Scene(engine);
			console.log('Hallo');
			setScene(scene);
			// scene.createDefaultCamera(true);
			// (scene.activeCamera as ArcRotateCamera).beta -= Math.PI / 8;
			var camera = new FreeCamera('webxr-camera', new Vector3(0, 1, -5), scene);
			camera.setTarget(Vector3.Zero());
			camera.minZ = 0.01;


			setCamera(scene.activeCamera!);
			scene.createDefaultLight(true);
			const rootNode = new TransformNode('Root Container', scene);
			setRootNode(rootNode);

			const deviceSourceManager = new DeviceSourceManager(engine);
			const handlePointerInput = (event: IMouseEvent) => {
				if (event.inputIndex === PointerInput.Move && event.movementX) {
					rootNode.rotate(Vector3.Down(), event.movementX * 0.005);
				};
			};

			deviceSourceManager.onDeviceConnectedObservable.add(device => {
				if (device.deviceType === DeviceType.Touch) {
					const touch = deviceSourceManager.getDeviceSource(device.deviceType, device.deviceSlot)!;
					touch.onInputChangedObservable.add(touchEvent => {
						handlePointerInput(touchEvent);
					});
				} else if (device.deviceType === DeviceType.Mouse) {
					const mouse = deviceSourceManager.getDeviceSource(device.deviceType, device.deviceSlot)!;
					mouse.onInputChangedObservable.add(mouseEvent => {
						if (mouse.getInput(PointerInput.LeftClick)) {
							handlePointerInput(mouseEvent);
						}
					});
				}
			});

			const transformContainer = new TransformNode('Transform Container', scene);
			transformContainer.parent = rootNode;
			transformContainer.scaling.scaleInPlace(0.2);
			transformContainer.position.y -= .2;

			scene.beforeRender = function () {
				transformContainer.rotate(Vector3.Up(), 0.005 * scene.getAnimationRatio());
			};

			SceneLoader.ImportMeshAsync('', 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb').then(result => {
				const mesh = result.meshes[0];
				mesh.parent = transformContainer;
			});
		}
	}, [engine]);

	useEffect(() => {
		if (rootNode) {
			rootNode.scaling = new Vector3(scale, scale, scale);
		}
	}, [rootNode, scale]);

	const startXR = () => {
		(async () => {
			console.log('Start XR');
			if (!scene || !rootNode) return;

			rootNode.getChildMeshes().forEach(m => m.isVisible = false);
			rootNode.rotationQuaternion = new Quaternion();

			const xr = await scene.createDefaultXRExperienceAsync({ disableDefaultUI: true, disableTeleportation: true });
			console.log('XR')

			const fm = xr.baseExperience.featuresManager;
			const xrTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, 'latest')as WebXRHitTest;
			const xrPlanes = fm.enableFeature(WebXRFeatureName.PLANE_DETECTION, 'latest');
			const anchors = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, 'latest')  as WebXRAnchorSystem;
			const xrBackgroundRemover = fm.enableFeature(WebXRFeatureName.BACKGROUND_REMOVER, 'latest');

			var isPlaced = false;

			var marker = CreateTorus(
				'marker',
				{
					diameter: 0.15,
					thickness: 0.05,
				},
				scene
			);
			marker.rotationQuaternion = new Quaternion();
			marker.isVisible = false;

			var hitTest: IWebXRHitResult;
			xrTest.onHitTestResultObservable.add((result) => {
				if (result.length) {
					marker.isVisible = !isPlaced;
					// marker.isVisible = true;
					hitTest = result[0];
					marker.position = hitTest.position;
					marker.rotationQuaternion = hitTest.rotationQuaternion;
				} else {
					marker.isVisible = false;
				}
			});

			if (anchors) {
				anchors.onAnchorAddedObservable.add((anchor) => {
					console.log('Anchor added');
					//rootNode.getChildMeshes().forEach((m) => (m.isVisible = true));
					// model.isVisible = true;
					// model.isEnabled(true);
					// anchor.attachedNode = rootNode;
					// shadowGenerator.addShadowCaster(model.attached)
				});
			}

			scene.onPointerDown = (evt: IPointerEvent, pickInfo: PickingInfo) => {
				if (hitTest && anchors && xr.baseExperience.state === WebXRState.IN_XR) {
					//console.log('hittest', hitTest);
					anchors.addAnchorPointUsingHitTestResultAsync(hitTest);
					//rootNode.position = hitTest.position;
					//rootNode.rotationQuaternion = hitTest.rotationQuaternion;
					//rootNode.getChildMeshes().forEach((m) => (m.isVisible = true));
					marker.isVisible = false;
					isPlaced = true;
				}
			};
		
		

			const session = await xr.baseExperience.enterXRAsync('immersive-ar', 'unbounded', xr.renderTarget);
			session.onXRSessionInit.addOnce(() => {
				console.log('Session Init');
			})
	})();
	}

	const onInitialized = useCallback(async (engineViewCallbacks: EngineViewCallbacks) => {
		setEngineViewCallbacks(engineViewCallbacks);
	}, [engine]);

	const onSnapshot = useCallback(async () => {
		if (engineViewCallbacks) {
			setSnapshotData('data:image/jpeg;base64,' + await engineViewCallbacks.takeSnapshot());
		}
	}, [engineViewCallbacks]);

	return (
		<>
			<View style={props.style}>
				<Button title="Start" onPress={ () => startXR() } />
				<EngineView camera={camera} onInitialized={onInitialized} displayFrameRate={true} antiAliasing={2} />
			</View>
		</>
	);
};

const App = () => {
	const [toggleScreen, setToggleScreen] = useState(false);

	return (
		<>
			<StatusBar barStyle="dark-content" />
			<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
				<EngineScreen style={{ flex: 1 }} />
			</SafeAreaView>
		</>
	);
};

export default App;
