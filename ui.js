var Windows = [];

function Context() {
	this.width = this.height = 0;
	this.buffers = [];
	this.clear = function() {
		for(var buffer in this.buffers) {
			buffer = this.buffers[buffer];
			if(buffer.buffer) gl.deleteBuffer(buffer.buffer);
		}
		this.buffers = [];
	};
	this.set = function(texture,colour) {
		if(!this.buffers.length || this.buffers[this.buffers.length-1].texture != texture || this.buffers[this.buffers.length-1].colour != colour)
			this.buffers.push({
				texture: texture,
				colour: colour,
				buffer: null,
				vertices: [],
			});
	};
	this.drawText = function(font,colour,x,y,text) { font.drawText(this,colour,x,y,text); };
	this.measureText = function(font,text) { return font.measureText(text); };
	this.rect = function(texture,colour,x1,y1,x2,y2) {
		this.set(texture,colour);
		this.buffers.vertices = this.buffers.vertices.concat([
			x1,y1, x2,y1, x1,y2,
			x2,y1, x1,y2, x2,y2]);
	};
	this.fillRect = function(colour,x1,y1,x2,y2) {
		this.rect(null,colour,x1,y1,x2,y2);
	};
	this.draw = function() {
		gl.useProgram(this.program);
		gl.activeTexture(gl.TEXTURE0);
		for(var buffer in this.buffers) {
			buffer = this.buffers[buffer];
			if(!buffer.vertices.length) continue;
			gl.bindTexture(gl.TEXTURE_2D,buffer.texture);
			gl.uniform4fv(program.colour,buffer.colour);
			if(!buffer.buffer) {
				buffer.buffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER,buffer.buffer);
				gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(buffer.vertices),gl.STATIC_DRAW);
			} else
				gl.bindBuffer(gl.ARRAY_BUFFER,buffer.buffer);
			gl.enableVertexAttribArray(this.program.vertex);
			gl.vertexAttribPointer(this.program.vertex,2,gl.FLOAT,false,0,0);
			gl.drawArrays(gl.TRIANGLES,0,this.vertices.length);
		}
		gl.disableVertexAttribArray(this.program.vertex);	
		gl.bindTexture(gl.TEXTURE_2D,null);
	}
};

function Window(modal,tree) {
	this.modal = modal;
	this.tree = tree;
	this.ctx = new Context();
	this.is_dirty = true;
	this.dirty = function() { this.is_dirty = true; }
	var init = function(node,parent) {
		node.parent = parent;
		node.is_dirty = true;
		node.dirty = function() {
			if(node.is_dirty) return;
			node.is_dirty = true;
			node.parent.dirty();
		}
		node.children = node.children || [];
		for(var child in node.children)
			init(node.children[child],node);
	};
	this.draw = function(canvas) {
		if(this.ctx.width != canvas.offsetWidth || this.ctx.height != canvas.offsetHeight) {
			this.ctx.width = canvas.offsetWidth;
			this.ctx.height = canvas.offsetHeight;
			this.is_dirty = true;
		}
		if(this.is_dirty) {
			this.ctx.clear();
			if(this.modal)
				this.ctx.fillRect([0.3,0.3,0.3,0.6],0,0,this.ctx.width,this.ctx.height);
			var draw = function(node,ctx) {
				node.is_dirty = false;
				node.draw(ctx);
				for(var child in node.children)
					node.children[child].draw(ctx);
			};
			draw(tree,this.ctx);
			this.is_dirty = false;
		}
		this.ctx.draw();
	};
	this.hide = function() {
		var idx = Windows.indexOf(this);
		if(idx != -1)
			Windows.splice(idx,1);
	};
	this.show = function() {
		this.hide();
		if(this.modal)
			Windows.push(this);
		else
			Windows.unshift(this);
	};
};

function draw(canvas) {
	for(var window in Windows)
		Windows[window].draw(canvas);
}
