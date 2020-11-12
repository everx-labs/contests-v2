const abi = {
    'ABI version': 2,
    header: ['pubkey', 'time', 'expire'],
    functions: [
        {
            name: 'constructor',
            inputs: [
                { name: 'participant', type: 'address' },
                { name: 'juryKeys', type: 'uint256[]' },
                { name: 'link', type: 'bytes' },
            ],
            outputs: [
            ],
        },
        {
            name: 'vote',
            inputs: [
            ],
            outputs: [
            ],
        },
        {
            name: 'getVotes',
            inputs: [
            ],
            outputs: [
                { name: 'votes', type: 'uint32' },
            ],
        },
        {
            name: 'getInfo',
            inputs: [
            ],
            outputs: [
                { name: 'contestAddr', type: 'address' },
                { name: 'participantAddr', type: 'address' },
                { name: 'link', type: 'bytes' },
                { components: [{ name: 'key', type: 'uint256' }, { name: 'isVoted', type: 'bool' }], name: 'jury', type: 'tuple[]' },
            ],
        },
    ],
    data: [
        { key: 1, name: 'm_contest', type: 'address' },
    ],
    events: [
    ],
};

const pkg = {
    abi,
    imageBase64: 'te6ccgECIAEABZIAAgE0BgEBAcACAgPPIAUDAQHeBAAD0CAAQdgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAIm/wD0pCAiwAGS9KDhiu1TWDD0oQkHAQr0pCD0oQgAAAIBIA0KAab/f40IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABPhpIe1E0CDXScIBjiDT/9M/0wDU0x/6QPQE+G74bPhq+G34a3/4Yfhm+GP4YgsB+o539AVxIYBA9A6OJI0IYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABN/4asjJ+Gtt+Gxw+G2NCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAT4bnABgED0DvK91wv/+GJw+GNw+GZ/+GHi0wABDAC4jh2BAgDXGCD5AQHTAAGU0/8DAZMC+ELiIPhl+RDyqJXTAAHyeuLTPwGOHvhDIbkgnzAg+COBA+iogggbd0Cgud6S+GPggDTyNNjTHwH4I7zyudMfAfAB+Edu8nwCASAXDgIBIBQPAQ+6Umphz4QW6BAC/o6A3vhG8nNx+Gb6QZXU0dD6QN8gxwGT1NHQ3tMf9ARZbwIB1NH4SfhKxwXy4GUg+GshbxBwk1MBuY4d+ExTFG8RgCD0DvKy1wv/AXDIygBZgQEA9EP4bKToXwT4bvhCyMv/+EPPCz/4Rs8LAPhL+E34SvhM+E5eQMzLH870AM4SEQAMye1Uf/hnAVTtRNAg10nCAY4g0//TP9MA1NMf+kD0BPhu+Gz4avht+Gt/+GH4Zvhj+GITAPSOd/QFcSGAQPQOjiSNCGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATf+GrIyfhrbfhscPhtjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE+G5wAYBA9A7yvdcL//hicPhjcPhmf/hh4gEJuxusOEgVAf74QW6OI+1E0NP/0z/TANTTH/pA9AT4bvhs+Gr4bfhrf/hh+Gb4Y/hi3tH4RSBukjBw3vhMgQEA9A4glAHXCgCRcOIh8uBmIPLQZ/gAf/hM+EUgbpIwcN4BWMjKAFmBAQD0Q/hsW/hNpLUf+G34QsjL//hDzws/+EbPCwD4S/hNFgAq+Er4TPhOXkDMyx/O9ADOye1Uf/hnAgEgHxgCASAbGQHHuchGN78ILdHEfaiaGn/6Z/pgGppj/0gegJ8N3w2fDV8Nvw1v/ww/DN8Mfwxb2j8JpDgf8cVEehpgP0gGBjkZ8OQZ0aCAAAAAAAAAAAAAAAABfIRjexnixDnhY/kuP2Abxhgf8BoAVo4l+ELIy//4Q88LP/hGzwsA+Ev4TfhK+Ez4Tl5AzMsfzvQAzsntVN5/+GcBCbj1+EIQHAH8+EFujiPtRNDT/9M/0wDU0x/6QPQE+G74bPhq+G34a3/4Yfhm+GP4Yt7RjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEjQhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEyMlwbW8CcG1vAvhMHQGmgQEA9IaVAdcKAH+TcHBw4pEgjjJfM8gizwv/Ic8KADExAW8iIaQDWYAg9ENvAjQi+EyBAQD0fJUB1woAf5NwcHDiAjUzMej4SvhO+EsmbIQkwP8eAMSOMCbQ0wH6QDAxyM+HIM6AYc9Az4PIz5KevwhCJc8WJM8WI88UIm8iAssf9ADNyXH7AN5fBMD/jiX4QsjL//hDzws/+EbPCwD4S/hN+Er4TPhOXkDMyx/O9ADOye1U3n/4ZwBi3XAi0NYCMdIA+kAw+GncIccA3CHXDR/yvFMR3cEEIoIQ/////byx8nwB8AH4R27yfA==',
};

module.exports = pkg;
