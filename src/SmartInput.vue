<script>
    let smartArea = require('./SmartArea');

    let SmartInput = {
        name: "smart-input",

        input_type: 'input',

        model: smartArea.model,
        props: smartArea.props,
        data: smartArea.data,
        computed: smartArea.computed,
        watch: smartArea.watch,
        mounted: smartArea.mounted,
        methods: smartArea.methods,

        render: smartArea.render,
    };

    export default SmartInput;
</script>

<style src="./main.css" scoped></style>