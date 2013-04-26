import os
import re

from gears.asset_attributes import AssetAttributes
from gears.compilers import ExecCompiler


IMPORT_RE = re.compile(r"""@import\s+(['"]?)(.*?)\1""")


class LESSCompiler(ExecCompiler):

    result_mimetype = 'text/css'
    executable = 'node'
    params = [os.path.join(os.path.dirname(__file__), 'compiler.js')]

    def __call__(self, asset):
        self.asset = asset
        self.register_dependencies()
        super(LESSCompiler, self).__call__(asset)

    def get_args(self):
        args = super(LESSCompiler, self).get_args()
        args.append(self.asset.absolute_path)
        return args

    def register_dependencies(self):
        for import_path in self.iter_import_paths():
            self.asset.dependencies.add(self.find_asset(import_path))

    def iter_import_paths(self):
        for match in IMPORT_RE.findall(self.asset.processed_source):
            import_path = match[1].split('?')[0]
            if not import_path.endswith('.css'):
                if not import_path.endswith('.less'):
                    import_path += '.less'
                yield import_path

    def find_asset(self, import_path):
        asset_path = self.get_asset_path(import_path)
        asset_attributes = AssetAttributes(self.asset.attributes.environment, asset_path)
        return self.asset.attributes.environment.find(asset_attributes, True)[1]

    def get_asset_path(self, import_path):
        import_path = os.path.join(self.asset.attributes.dirname, import_path)
        return os.path.normpath(import_path)
