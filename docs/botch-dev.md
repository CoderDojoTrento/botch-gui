# Botch notes



## Events

An Event is just a string (you can add a function but I didn’t try yet). Suppose you have a custom event, like 'BOTCH_STORAGE_HELPER_UPDATE'

For readability, define a static property:

```javascript
class Scratch3Botch {
 
   static get BOTCH_STORAGE_HELPER_UPDATE (){
       return 'BOTCH_STORAGE_HELPER_UPDATE';
   }
```

emit somewhere the string: 

```javascript
this.runtime.emit(Scratch3Botch.BOTCH_STORAGE_HELPER_UPDATE);
```

In VirtualMachine class in `virtual-machine.js`, for some reason you have to re-emit the custom message:

```javascript 
       // Botch
       this.runtime.on('BOTCH_STORAGE_HELPER_UPDATE', () => {
           this.emit('BOTCH_STORAGE_HELPER_UPDATE');
       });
```

receive the message: 

```javascript
   this.props.vm.on('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
```    


NOTE: If you are in GUI, you need to bind the method, otherwise `this` will not be accessible:

```javascript
constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'updateSprites'
        ]);
```

