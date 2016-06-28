var jengaGame = (function(){

	"use strict";
	
	Physijs.scripts.worker = 'physijs_worker.js';
	Physijs.scripts.ammo = 'ammo.js';

	var scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 }),
	renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer({antialias: true}) : new THREE.CanvasRenderer(),
	camera,
	physics_stats,
	controls, // mouse control
	rectangle, // jenga object type
	tower, // jenga tower i.e. total sum of jenga pieces
	blocks = [],
	posx = -13, // inital horizontal position of jenga pieces
	loader = new THREE.TextureLoader(),
	raycaster = new THREE.Raycaster(),
	intersect_plane,
	selected_block = null, 
	mouse_position = new THREE.Vector3, 
	block_offset = new THREE.Vector3,
	_vector = new THREE.Vector3,
	handleMouseDown, 
	handleMouseMove, 
	handleMouseUp,
	_i, 
	_v3 = new THREE.Vector3;

	function initScene(){

		physics_stats = new Stats();
		physics_stats.domElement.style.position = 'absolute';
		physics_stats.domElement.style.top = '50px';
		physics_stats.domElement.style.zIndex = 100;
		document.getElementById( 'jenga-container' ).appendChild( physics_stats.domElement );

		scene.setGravity(new THREE.Vector3(0,-50,0));
		scene.addEventListener(
			'update',
			function() {
				if ( selected_block !== null ) {
					
					_v3.copy( mouse_position ).add( block_offset ).sub( selected_block.position ).multiplyScalar( 5 );
					_v3.y = 0;
					selected_block.setLinearVelocity( _v3 );
					
					// Reactivate all of the blocks
					_v3.set( 0, 0, 0 );
					for ( _i = 0; _i < blocks.length; _i++ ) {
						blocks[_i].applyCentralImpulse( _v3 );
					}
				}
				scene.simulate( undefined, 1 );
				physics_stats.update();
			}
		);

		renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById("jenga-container").appendChild(renderer.domElement);

		camera = new THREE.PerspectiveCamera(
			40,
			window.innerWidth/window.innerHeight,
			1,
			1000
			);

	 	//tower = jengaPiece();
		for(var i=0; i<16; i++)
		{
			for(var j=0; j<3; j++)
			{
				tower = jengaPiece();
				tower.position.x = posx;
				posx += 10; // increases horizontal distance between jenga pieces
				tower.position.y += 5*i; // increases vertical distance between jenga pieces

				if(i%2 === 0)
				{
					tower.rotation.x = 0; // resets horizontal position
					tower.rotation.y = 0; // resets vertical position
					rectangle.rotation.z = Math.PI/2; //rotates jenga pieces 90 degrees
					tower.position.x = -3;
					tower.translateZ(10*j);
					tower.position.z -= 10;
				}

				scene.add(tower);
				blocks.push(tower);

			}

			tower.name = "jenga";
			
			posx = -13;
		}

		//plane allows the dragging of jenga blocks
		intersect_plane = new THREE.Mesh(
			new THREE.PlaneGeometry( 150, 150 ),
			new THREE.MeshBasicMaterial({ opacity: 0, transparent: true })
		);
		intersect_plane.rotation.x = Math.PI / -2;
		scene.add( intersect_plane );

        render();
	}
		
	function jengaPiece(){

		var blockTexture = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: loader.load('texture/wood7.jpg')}),
			.4, // medium friction
			.4 // medium resitution
		);

		rectangle = new Physijs.BoxMesh(
			new THREE.BoxGeometry(5,28,8),
			blockTexture //Physijs material
		);

		rectangle.rotation.x = Math.PI/2;
		rectangle.rotation.y = Math.PI/2;

		return rectangle;
	}

	handleMouseDown = function( evt ) {
			var ray, intersections;
			
			_vector.set(
				( evt.clientX / window.innerWidth ) * 2 - 1,
				-( evt.clientY / window.innerHeight ) * 2 + 1,
				1
			);
			_vector.unproject( camera );
			
			ray = new THREE.Raycaster( camera.position, _vector.sub( camera.position ).normalize() );
			intersections = ray.intersectObjects( blocks );
			if ( intersections.length > 0 ) {
				selected_block = intersections[0].object;
				
				_vector.set( 0, 0, 0 );
				selected_block.setAngularFactor( _vector );
				selected_block.setAngularVelocity( _vector );
				selected_block.setLinearFactor( _vector );
				selected_block.setLinearVelocity( _vector );
				mouse_position.copy( intersections[0].point );
				block_offset.subVectors( selected_block.position, mouse_position );
				
				intersect_plane.position.y = mouse_position.y;
			}
		};
		
		handleMouseMove = function( evt ) {
			
			var ray, intersection,
				i, scalar;
			
			if ( selected_block !== null ) {
				
				_vector.set(
					( evt.clientX / window.innerWidth ) * 2 - 1,
					-( evt.clientY / window.innerHeight ) * 2 + 1,
					1
				);
				_vector.unproject( camera );
				
				ray = new THREE.Raycaster( camera.position, _vector.sub( camera.position ).normalize() );
				intersection = ray.intersectObject( intersect_plane );
				mouse_position.copy( intersection[0].point );
			}
			
		};
		
		handleMouseUp = function( evt ) {
			
			if ( selected_block !== null ) {
				_vector.set( 1, 1, 1 );
				selected_block.setAngularFactor( _vector );
				selected_block.setLinearFactor( _vector );
				
				selected_block = null;
			}
			
		};

	function render(){

		scene.simulate(); // starts the physijs physics engine

		requestAnimationFrame(render);
		renderer.render(scene, camera);

		renderer.domElement.addEventListener( 'mousedown', handleMouseDown );
		renderer.domElement.addEventListener( 'mousemove', handleMouseMove );
		renderer.domElement.addEventListener( 'mouseup', handleMouseUp );
	}

	window.onload = initScene;

	return {
		scene: scene
	}

})();
