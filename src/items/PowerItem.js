class PowerItem extends Item {
  constructor(name) {
    super(name);
    this.onByDefault = true;
    this.controllerName = '';
  }
  
  extendBody(obj) {
    super.extendBody(obj);
    obj.updateProc = (gadgetBodies) => {
      const controllerBody = gadgetBodies.find((gadgetBody) => gadgetBody.name == this.controllerName);
      if (this.onByDefault ^ (controllerBody ? controllerBody.toggleState : 0)) {
        obj.status = true;
        obj?.powerProc?.();
      }
      else {
        obj.status = false;
        obj?.standbyProc?.();
      }
    }
  }
}
