(function (root, undefined) {
    'use strict';

    var THREE = root.THREE;

    // Window helper for calculations.
    var win = {
        width: root.innerWidth,
        height: root.innerHeight,
        halfWidth: root.innerWidth / 2,
        halfHeight: root.innerHeight / 2,
        aspect: root.innerWidth / root.innerHeight,
        devicePixelRatio: root.devicePixelRatio
    }

    // Initial mouse position is in the middle of screen.
    var mouseX = win.winHalfW; 
    var mouseY = win.winHalfH;

    var loop = null;

    function onDocumentMouseMove(e) {
        mouseX = (e.clientX - win.halfWidth) / 2;
        mouseY = (e.clientY - win.halfHeight) / 2;
    }

    function getObjectCenterPosition(obj) {
        var Box = new THREE.Box3().setFromObject(obj);
        return Box.center();
    }

    function PokemonViewer(containerID) {
        containerID = containerID || 'scene';

        this.$container = document.getElementById(containerID);
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
        },

        setupRenderer: function () {
            var renderer= this.renderer = new THREE.WebGLRenderer();
            renderer.setPixelRatio(win.devicePixelRatio);
            renderer.setSize(win.width, win.height);
            renderer.setClearColor(new THREE.Color('hsl(0, 0%, 10%)'));

            this.$container.appendChild(renderer.domElement);
        },

        setupScene: function () {
            this.scene = new THREE.Scene();
        },

        setupCamera: function () {
            var camera = this.camera = new THREE.PerspectiveCamera(45, win.aspect, 1, 1000);
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
            var controls = this.controls = new THREE.OrbitControls(camera, domElement);
            var domElement = this.renderer.domElement;
            var renderHandler = this.render.bind(this);

            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;
            controls.minDistance = 20;
            controls.maxDistance = 200;

            controls.addEventListener('change', renderHandler);
        },

        loadPokemon: function (name) {
            var self = this;
            var paths = {
                base: './src/pokedex/' + name + '/',
                model: name + '.obj',
                texture: name + '.mtl'
            };
            var mtlLoader = new THREE.MTLLoader();

            mtlLoader.setPath(paths.base);
            mtlLoader.load(paths.texture, function (materialCreator) {
                materialCreator.preload();

                var materials = materialCreator.materials;
                var objLoader = new THREE.OBJLoader();

                if (materials.default) {
                    materials.materials.default.map.magFilter = THREE.NearestFilter;
                    materials.materials.default.map.minFilter = THREE.LinearFilter;
                }

                objLoader.setMaterials(materialCreator); self.render();
                objLoader.setPath(paths.base);
                objLoader.load(paths.model, function (model) {
                    // Hack to force pokemon to look forward.
                    model.rotation.x = -5;

                    self.scene.add(model);

                    // Set OrbiControls target using center point of loaded model.
                    var centerPos = getObjectCenterPosition(model);
                    self.controls.target.set(centerPos.x, centerPos.y, centerPos.z);

                    self.render();
                });
            });
        },

        render: function () {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Add `PokemonViewer` to global scope.
    root.PokemonViewer = PokemonViewer;
})(window);
