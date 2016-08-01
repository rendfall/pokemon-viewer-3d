(function (root, undefined) {
    'use strict';

    var THREE = root.THREE;

    // Window helper for calculations.
    var getWindow = function () {
        var width = root.innerWidth;
        var height = root.innerHeight;

        return {
            width: width,
            height: height,
            aspect: (width / height),
            devicePixelRatio: root.devicePixelRatio
        }
    };

    function webglAvailable() {
        try {
            var canvas = root.document.createElement('canvas');
            return !!
                root.window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) { 
            return false;
        }
    }

    function getObjectCenterPosition(obj) {
        var Box = new THREE.Box3().setFromObject(obj);
        return Box.center();
    }

    function PokemonViewer(containerID) {
        containerID = containerID || 'scene';

        this.$container = root.document.getElementById(containerID);
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.pokemon = null;

        this.setup();
    }

    PokemonViewer.prototype = {
        setup: function () {
            this.setupRenderer();
            this.setupScene();
            this.setupCamera();
            this.setupControls();
            this.setupLight();
            this.setupListeners();
        },

        setupRenderer: function () {
            var renderer = webglAvailable() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
            renderer.setPixelRatio(getWindow().devicePixelRatio);
            renderer.setSize(getWindow().width, getWindow().height);
            renderer.setClearColor(new THREE.Color('hsl(0, 0%, 10%)'));

            this.renderer = renderer;
            this.$container.appendChild(renderer.domElement);
        },

        setupScene: function () {
            this.scene = new THREE.Scene();
        },

        setupCamera: function () {
            var camera = this.camera = new THREE.PerspectiveCamera(45, getWindow().aspect, 1, 1000);
            camera.position.z = 50;
        },

        setupLight: function () {
            var scene = this.scene;

            var ambient = new THREE.AmbientLight(0xffffff, 1.0);
            var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
            var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
            var backLight = new THREE.DirectionalLight(0xffffff, 1.0);

            keyLight.position.set(-100, 0, 100);
            fillLight.position.set(100, 0, 100);
            backLight.position.set(100, 0, -100).normalize();

            scene.add(ambient);
            scene.add(keyLight);
            scene.add(backLight);
        },

        setupControls: function () {
            var camera = this.camera;
            var domElement = this.renderer.domElement;
            var controls = this.controls = new THREE.OrbitControls(camera, domElement);
            var renderHandler = this.render.bind(this);

            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;
            controls.enablePan = false;
            controls.minDistance = 20;
            controls.maxDistance = 200;

            controls.addEventListener('change', renderHandler);
        },

        setupListeners: function () {
            var self = this;

            root.addEventListener('resize', function () {
                self.camera.aspect = getWindow().aspect;
                self.camera.updateProjectionMatrix();
                self.renderer.setSize(getWindow().width, getWindow().height);
                self.render();
            }, false);
        },

        loadPokemon: function (name) {
            // Refresh scene.
            if (this.pokemon) {
                this.scene.remove(this.pokemon);
            }

            var self = this;
            var paths = {
                base: './src/pokedex/' + name + '/',
                model: name + '.obj',
                texture: name + '.mtl'
            };

            var mtlLoader = new THREE.MTLLoader();

            // Refresh model only when material will loaded completely
            mtlLoader.manager.onLoad = function () {
                // `control.update` triggers `render` so we don't need call it directly.
                self.controls.update();
            };
            mtlLoader.setPath(paths.base);
            mtlLoader.load(paths.texture, function (materialCreator) {
                materialCreator.preload();

                var materials = materialCreator.materials;
                var objLoader = new THREE.OBJLoader();

                if (materials.default) {
                    materials.materials.default.map.magFilter = THREE.NearestFilter;
                    materials.materials.default.map.minFilter = THREE.LinearFilter;
                }

                objLoader.setMaterials(materialCreator);
                objLoader.setPath(paths.base);
                objLoader.load(paths.model, function (model) {
                    var pokemon = self.pokemon = model;

                    // Hack to force pokemon to look forward.
                    pokemon.rotation.x = -5;

                    self.scene.add(pokemon);

                    // Set OrbiControls target using center point of loaded model.
                    var centerPos = getObjectCenterPosition(pokemon);
                    self.controls.target.set(centerPos.x, centerPos.y, centerPos.z);
                });
            });
        },

        render: function () {
            this.renderer.render(this.scene, this.camera);
        }
    };

    // Add `PokemonViewer` to global scope.
    root.PokemonViewer = PokemonViewer;
})(window);
